<?php
/**
 * RK: traka za osnovno formatiranje iznad QuillThreads polja za komentar.
 *
 * QuillThreads (Shondalai) ima obično polje za tekst i Markdown formatiranje, ali bez dugmića.
 * Ova skripta radi pored njegovog koda, ne u njemu: prati stranu (MutationObserver), pronađe
 * polje `textarea.qt-composer-input` i iznad njega ubaci traku (podebljano, kurziv, veza, citat,
 * spisak, kod, YouTube sa prozorčićem za vezu, emodži birač kao u JComments-u). Vrednost upisuje kroz React-ov setter, pa Quill vidi
 * izmenu kao da je otkucana.
 *
 * Učitava se samo kad je QuillThreads uključen i kad mu je formatiranje Markdown ili ograničen HTML;
 * sa običnim tekstom traka nema smisla.
 *
 * @package   plg_system_rkqtoolbar
 * @copyright 2026 Radnička Klasa
 * @license   GNU/GPL v2 or later
 */

defined('_JEXEC') or die;

use Joomla\CMS\Component\ComponentHelper;
use Joomla\CMS\Factory;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Plugin\CMSPlugin;

class PlgSystemRkqtoolbar extends CMSPlugin
{
	protected $autoloadLanguage = true;

	public function onBeforeCompileHead(): void
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

		if (!$this->markdownEnabled())
		{
			return;
		}

		$wa = $app->getDocument()->getWebAssetManager();
		$wa->registerAndUseStyle('plg_system_rkqtoolbar', 'plg_system_rkqtoolbar/toolbar.css');
		// emoji.js = birač (isti kao naš u JComments-u), toolbar.js ga koristi pa ide posle njega
		$wa->registerAndUseScript('plg_system_rkqtoolbar.emoji', 'plg_system_rkqtoolbar/emoji.js', [], ['defer' => true]);
		$wa->registerAndUseScript('plg_system_rkqtoolbar', 'plg_system_rkqtoolbar/toolbar.js', [], ['defer' => true], ['plg_system_rkqtoolbar.emoji']);

		$buttons = array_values(array_filter(array_map('trim', explode(',', (string) $this->params->get('buttons', 'bold,italic,link,quote,list,code,youtube,emoji')))));

		// QuillThreads 1.1.1: u Markdown režimu klijent NE prevodi Markdown u HTML, a server samo propušta
		// dozvoljene HTML oznake (SanitizerService::allowlistHtml). Zato traka podrazumevano umeće HTML.
		$syntax = (string) $this->params->get('syntax', 'auto');
		$syntax = $syntax === 'markdown' ? 'markdown' : 'html';

		$app->getDocument()->addScriptOptions('plg_system_rkqtoolbar', [
			'buttons' => $buttons,
			'syntax'  => $syntax,
			'labels'  => [
				'bold'   => Text::_('PLG_SYSTEM_RKQTOOLBAR_BOLD'),
				'italic' => Text::_('PLG_SYSTEM_RKQTOOLBAR_ITALIC'),
				'link'   => Text::_('PLG_SYSTEM_RKQTOOLBAR_LINK'),
				'quote'  => Text::_('PLG_SYSTEM_RKQTOOLBAR_QUOTE'),
				'list'   => Text::_('PLG_SYSTEM_RKQTOOLBAR_LIST'),
				'code'   => Text::_('PLG_SYSTEM_RKQTOOLBAR_CODE'),
				'hint'   => Text::_($syntax === 'markdown' ? 'PLG_SYSTEM_RKQTOOLBAR_HINT_MARKDOWN' : 'PLG_SYSTEM_RKQTOOLBAR_HINT_HTML'),
				'linkText' => Text::_('PLG_SYSTEM_RKQTOOLBAR_LINK_TEXT'),
				'youtube' => Text::_('PLG_SYSTEM_RKQTOOLBAR_YOUTUBE'),
				'youtubeText' => Text::_('PLG_SYSTEM_RKQTOOLBAR_YOUTUBE_TEXT'),
				'youtubePlay' => Text::_('PLG_SYSTEM_RKQTOOLBAR_YOUTUBE_PLAY'),
				'youtubePrompt' => Text::_('PLG_SYSTEM_RKQTOOLBAR_YOUTUBE_PROMPT'),
				'youtubeBad' => Text::_('PLG_SYSTEM_RKQTOOLBAR_YOUTUBE_BAD'),
				'emoji'  => Text::_('PLG_SYSTEM_RKQTOOLBAR_EMOJI'),
				'close'  => Text::_('JCLOSE'),
				'emojiSearch' => Text::_('PLG_SYSTEM_RKQTOOLBAR_EMOJI_SEARCH'),
				'emojiRecent' => Text::_('PLG_SYSTEM_RKQTOOLBAR_EMOJI_RECENT'),
				'emojiResults' => Text::_('PLG_SYSTEM_RKQTOOLBAR_EMOJI_RESULTS'),
				'emojiNone' => Text::_('PLG_SYSTEM_RKQTOOLBAR_EMOJI_NONE'),
			],
		]);
	}

	/**
	 * QuillThreads čuva podešavanja u #__quillthreads_settings (setting_key / setting_value).
	 */
	private function markdownEnabled(): bool
	{
		try
		{
			$db    = Factory::getContainer()->get(\Joomla\Database\DatabaseInterface::class);
			$query = $db->getQuery(true)
				->select($db->quoteName('setting_value'))
				->from($db->quoteName('#__quillthreads_settings'))
				->where($db->quoteName('setting_key') . ' = ' . $db->quote('formatting'));
			$value = (string) $db->setQuery($query)->loadResult();

			return in_array($value, ['markdown', 'limited_html'], true);
		}
		catch (\Throwable $e)
		{
			return false;
		}
	}
}
