<?php
/**
 * RK: galerija avatara za QuillThreads (gosti i registrovani korisnici), po uzoru na naš plg_jcomments_rkavatar.
 *
 * Posetilac bira avatar iz foldera dok piše komentar. Izbor putuje uz Quill-ov JSON zahtev (polje `rk_avatar`,
 * dodaje ga naša skripta u XHR), a ovde ga hvatamo na događaju `onQuillthreadsCommentAfterCreate` iz php://input
 * i upisujemo u #__quillthreads_rkavatar (comment_id, avatar). Quill nema kuku za avatar na serveru (uvek vraća
 * prazno i crta inicijale), pa spisak komentara dobija slike u pregledaču: skripta skupi ID-eve sa strane,
 * pita com_ajax (onAjaxRkqtavatar) i inicijale zameni slikom. Komentari bez izbora dobijaju stalni avatar
 * izveden iz imena autora (isti autor = ista slika). Quill-ovo jezgro se ne menja.
 *
 * @package   plg_system_rkqtavatar
 * @copyright 2026 Radnička Klasa
 * @license   GNU/GPL v2 or later
 */

defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Log\Log;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Uri\Uri;
use Joomla\Database\ParameterType;
use Joomla\Event\Event;
use Joomla\Event\SubscriberInterface;

class PlgSystemRkqtavatar extends CMSPlugin implements SubscriberInterface
{
	protected $autoloadLanguage = true;

	/** @var array|null Keširan spisak fajlova galerije */
	private $gallery = null;

	public static function getSubscribedEvents(): array
	{
		return [
			'onBeforeCompileHead'              => 'onBeforeCompileHead',
			'onAjaxRkqtavatar'                 => 'onAjaxRkqtavatar',
			'onQuillthreadsCommentAfterCreate' => 'onQuillthreadsCommentAfterCreate',
			'onQuillthreadsCommentAfterDelete' => 'onQuillthreadsCommentAfterDelete',
		];
	}

	/* ------------------------------------------------------------------ pomoćne */

	private function galleryPath(): string
	{
		$path = trim((string) $this->params->get('gallery_path', 'images/quillthreads/avatars'), "/\\ ");

		return $path !== '' ? $path : 'images/quillthreads/avatars';
	}

	/** Imena fajlova u folderu galerije, prirodno sortirana (a01, a02, ...). */
	private function gallery(): array
	{
		if ($this->gallery === null)
		{
			$this->gallery = [];
			$dir = JPATH_ROOT . '/' . $this->galleryPath();

			if (is_dir($dir))
			{
				foreach (scandir($dir) ?: [] as $file)
				{
					if (preg_match('/^[a-z0-9_-]+\.(png|jpe?g|webp|svg)$/i', $file))
					{
						$this->gallery[] = $file;
					}
				}

				sort($this->gallery, SORT_NATURAL | SORT_FLAG_CASE);
			}
		}

		return $this->gallery;
	}

	private function url(string $file): string
	{
		return Uri::root() . $this->galleryPath() . '/' . $file;
	}

	/** Stalna zamena: isto ime autora (ili isti korisnik) uvek dobija isti avatar. */
	private function fallback(string $name, int $userId): string
	{
		$gallery = $this->gallery();

		if (!$gallery)
		{
			return '';
		}

		$key = $userId > 0 ? 'u' . $userId : mb_strtolower(trim($name));

		return $gallery[crc32($key) % count($gallery)];
	}

	private function db()
	{
		return Factory::getContainer()->get(\Joomla\Database\DatabaseInterface::class);
	}

	private function ensureTable(): void
	{
		static $done = false;

		if ($done)
		{
			return;
		}

		$done = true;
		$db   = $this->db();

		try
		{
			$db->setQuery(
				'CREATE TABLE IF NOT EXISTS ' . $db->quoteName('#__quillthreads_rkavatar') . ' ('
				. $db->quoteName('comment_id') . ' BIGINT UNSIGNED NOT NULL, '
				. $db->quoteName('avatar') . " VARCHAR(64) NOT NULL DEFAULT '', "
				. 'PRIMARY KEY (' . $db->quoteName('comment_id') . ')'
				. ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 DEFAULT COLLATE=utf8mb4_unicode_ci'
			)->execute();
		}
		catch (\RuntimeException $e)
		{
			Log::add($e->getMessage(), Log::ERROR, 'plg_system_rkqtavatar');
		}
	}

	/** Avatar iz Quill-ovog JSON zahteva (skripta doda `rk_avatar`), proveren u galeriji ('' kad ga nema). */
	private function submittedAvatar(): string
	{
		$raw  = (string) file_get_contents('php://input');
		$data = $raw !== '' ? json_decode($raw, true) : null;
		$file = is_array($data) ? basename((string) ($data['rk_avatar'] ?? '')) : '';

		return ($file !== '' && in_array($file, $this->gallery(), true)) ? $file : '';
	}

	private function store(int $commentId, string $file): void
	{
		if ($commentId <= 0)
		{
			return;
		}

		$this->ensureTable();
		$db = $this->db();

		try
		{
			if ($file === '')
			{
				$query = $db->getQuery(true)
					->delete($db->quoteName('#__quillthreads_rkavatar'))
					->where($db->quoteName('comment_id') . ' = :id')
					->bind(':id', $commentId, ParameterType::INTEGER);
			}
			else
			{
				$query = 'REPLACE INTO ' . $db->quoteName('#__quillthreads_rkavatar')
					. ' (' . $db->quoteName('comment_id') . ', ' . $db->quoteName('avatar') . ') VALUES ('
					. (int) $commentId . ', ' . $db->quote($file) . ')';
			}

			$db->setQuery($query)->execute();
		}
		catch (\RuntimeException $e)
		{
			Log::add($e->getMessage(), Log::ERROR, 'plg_system_rkqtavatar');
		}
	}

	/* ------------------------------------------------------------------ događaji */

	/** Skripta i stil na strani članka kad je QuillThreads uključen. */
	public function onBeforeCompileHead(Event $event): void
	{
		$app = Factory::getApplication();

		if (!$app->isClient('site'))
		{
			return;
		}

		$input = $app->getInput();

		if ($input->get('format', 'html') !== 'html' || $input->get('option') !== 'com_content')
		{
			return;
		}

		if (!ComponentHelper::isEnabled('com_quillthreads') || $app->getDocument()->getType() !== 'html')
		{
			return;
		}

		$gallery = $this->gallery();

		if (!$gallery)
		{
			return;
		}

		$wa = $app->getDocument()->getWebAssetManager();
		$wa->registerAndUseStyle('plg_system_rkqtavatar', 'plg_system_rkqtavatar/avatar.css');
		$wa->registerAndUseScript('plg_system_rkqtavatar', 'plg_system_rkqtavatar/avatar.js', [], ['defer' => true]);

		$list = [];

		foreach ($gallery as $i => $file)
		{
			$list[] = ['file' => $file, 'url' => $this->url($file), 'title' => Text::sprintf('PLG_SYSTEM_RKQTAVATAR_N', $i + 1)];
		}

		$app->getDocument()->addScriptOptions('plg_system_rkqtavatar', [
			'gallery'  => $list,
			'picker'   => (int) $this->params->get('show_picker', 1),
			'remember' => (int) $this->params->get('remember', 1),
			'ajax'     => Uri::root() . 'index.php?option=com_ajax&group=system&plugin=rkqtavatar&format=json',
			'labels'   => [
				'pick'     => Text::_('PLG_SYSTEM_RKQTAVATAR_PICK'),
				'optional' => Text::_('PLG_SYSTEM_RKQTAVATAR_OPTIONAL'),
				'change'   => Text::_('PLG_SYSTEM_RKQTAVATAR_CHANGE'),
				'none'     => Text::_('PLG_SYSTEM_RKQTAVATAR_NONE'),
				'done'     => Text::_('PLG_SYSTEM_RKQTAVATAR_DONE'),
				'close'    => Text::_('JCLOSE'),
			],
		]);
	}

	/**
	 * com_ajax: ?ids=1,2,3 -> { "1": "url", "2": "url" } (izabrani ili stalni zamenski avatar, za svaki ID).
	 */
	public function onAjaxRkqtavatar(Event $event): void
	{
		$app = Factory::getApplication();
		$ids = array_values(array_unique(array_filter(array_map('intval', explode(',', (string) $app->getInput()->getString('ids', ''))))));
		$ids = array_slice($ids, 0, 200);
		$out = [];

		if ($ids && $this->gallery())
		{
			$this->ensureTable();
			$db = $this->db();

			try
			{
				$query = $db->getQuery(true)
					->select([
						$db->quoteName('c.id'),
						$db->quoteName('c.user_id'),
						$db->quoteName('c.guest_name'),
						$db->quoteName('u.name', 'user_name'),
						$db->quoteName('a.avatar'),
					])
					->from($db->quoteName('#__quillthreads_comments', 'c'))
					->join('LEFT', $db->quoteName('#__users', 'u') . ' ON ' . $db->quoteName('u.id') . ' = ' . $db->quoteName('c.user_id'))
					->join('LEFT', $db->quoteName('#__quillthreads_rkavatar', 'a') . ' ON ' . $db->quoteName('a.comment_id') . ' = ' . $db->quoteName('c.id'))
					->whereIn($db->quoteName('c.id'), $ids);

				foreach ($db->setQuery($query)->loadObjectList() as $row)
				{
					$file = (string) ($row->avatar ?? '');

					if ($file === '' || !in_array($file, $this->gallery(), true))
					{
						$userId = (int) $row->user_id;
						$name   = $userId > 0 ? (string) ($row->user_name ?? '') : (string) $row->guest_name;
						$file   = $this->fallback($name, $userId);
					}

					if ($file !== '')
					{
						$out[(string) $row->id] = $this->url($file);
					}
				}
			}
			catch (\RuntimeException $e)
			{
				Log::add($e->getMessage(), Log::ERROR, 'plg_system_rkqtavatar');
			}
		}

		if (method_exists($event, 'addResult'))
		{
			$event->addResult($out);
		}
		else
		{
			$event->setArgument('result', array_merge((array) $event->getArgument('result', []), [$out]));
		}
	}

	/** Quill-ov CommentEvent (getCommentId), okida ga CommentService::create posle upisa. */
	public function onQuillthreadsCommentAfterCreate(Event $event): void
	{
		if (!method_exists($event, 'getCommentId'))
		{
			return;
		}

		$this->store((int) $event->getCommentId(), $this->submittedAvatar());
	}

	public function onQuillthreadsCommentAfterDelete(Event $event): void
	{
		if (!method_exists($event, 'getCommentId'))
		{
			return;
		}

		$this->store((int) $event->getCommentId(), '');
	}
}
