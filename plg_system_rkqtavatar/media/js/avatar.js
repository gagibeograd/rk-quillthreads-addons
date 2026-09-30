/* RK: galerija avatara za QuillThreads (po uzoru na naš JComments birač). Radi pored Quill-ovog React koda:
 *  1. u obrazac ubaci dugme „Izaberite svoj avatar" (pregled + natpis) i prozor sa galerijom;
 *  2. izbor doda u Quill-ov JSON zahtev (task=comments.create) kao `rk_avatar`, server ga upiše (rkqtavatar.php);
 *  3. u spisku komentara inicijale zameni slikom: skupi ID-eve (id="comment-N"), pita com_ajax, upiše sliku
 *     kao pozadinu Quill-ovog čvora (čvor ostaje njegov, React ga i dalje sme da menja). */
(function () {
	'use strict';

	var opts = (window.Joomla && Joomla.getOptions && Joomla.getOptions('plg_system_rkqtavatar')) || {};
	var GALLERY = opts.gallery || [];
	var L = opts.labels || {};
	var KEY = 'rkqt_avatar';

	if (!GALLERY.length) { return; }

	var chosen = '';
	var byFile = {};
	GALLERY.forEach(function (g) { byFile[g.file] = g.url; });

	try { if (opts.remember && byFile[localStorage.getItem(KEY) || '']) { chosen = localStorage.getItem(KEY); } } catch (e) {}

	/* ---------------------------------------------------------------- 2. izbor putuje uz zahtev */
	var origOpen = XMLHttpRequest.prototype.open, origSend = XMLHttpRequest.prototype.send;
	XMLHttpRequest.prototype.open = function (m, url) { this._rkUrl = String(url || ''); return origOpen.apply(this, arguments); };
	XMLHttpRequest.prototype.send = function (body) {
		if (chosen && this._rkUrl.indexOf('comments.create') !== -1 && typeof body === 'string') {
			try { var j = JSON.parse(body); if (j && typeof j === 'object') { j.rk_avatar = chosen; body = JSON.stringify(j); } } catch (e) {}
		}
		return origSend.call(this, body);
	};
	if (window.fetch) {
		var origFetch = window.fetch;
		window.fetch = function (input, init) {
			try {
				var url = typeof input === 'string' ? input : (input && input.url) || '';
				if (chosen && url.indexOf('comments.create') !== -1 && init && typeof init.body === 'string') {
					var j = JSON.parse(init.body); if (j && typeof j === 'object') { j.rk_avatar = chosen; init = Object.assign({}, init, { body: JSON.stringify(j) }); }
				}
			} catch (e) {}
			return origFetch.call(this, input, init);
		};
	}

	/* ---------------------------------------------------------------- slika na Quill-ovom avatar čvoru */
	function paint(node, url) {
		if (!node) { return; }
		if (url) {
			/* data-rk-av (React ne dira tuđe atribute; className bi mu prebrisao) + pozadina */
			if (node.dataset.rkAv !== url) { node.dataset.rkAv = url; node.style.backgroundImage = 'url("' + url + '")'; }
		} else if (node.dataset.rkAv) {
			delete node.dataset.rkAv; node.style.backgroundImage = '';
		}
	}

	/* pregled u obrascu (Quill-ov krug „GO" pored polja) prati izbor */
	function paintComposers() {
		document.querySelectorAll('.qt-composer-avatar').forEach(function (n) { paint(n, chosen ? byFile[chosen] : ''); });
	}

	/* ---------------------------------------------------------------- 1. dugme i prozor */
	var modal = null, lastFocus = null;

	function buildModal() {
		modal = document.createElement('div');
		modal.className = 'rk-qta-modal';
		modal.setAttribute('role', 'dialog');
		modal.setAttribute('aria-modal', 'true');
		modal.setAttribute('aria-label', L.pick || 'Avatar');
		modal.hidden = true;
		var grid = GALLERY.map(function (g) {
			return '<button type="button" class="rk-qta-opt" role="option" aria-selected="false" data-avatar="' + g.file + '" title="' + (g.title || '') + '">'
				+ '<img src="' + g.url + '" alt="" width="64" height="64" loading="lazy" decoding="async"></button>';
		}).join('');
		modal.innerHTML =
			'<div class="rk-qta-modal__backdrop" data-rk-close></div>'
			+ '<div class="rk-qta-modal__box" tabindex="-1">'
			+ '<div class="rk-qta-modal__head"><div class="rk-qta-modal__title"></div>'
			+ '<button type="button" class="rk-qta-modal__close" data-rk-close aria-label="">&times;</button></div>'
			+ '<div class="rk-qta-grid" role="listbox">' + grid + '</div>'
			+ '<div class="rk-qta-modal__foot">'
			+ '<button type="button" class="rk-qta-btn rk-qta-btn--ghost" data-rk-clear></button>'
			+ '<button type="button" class="rk-qta-btn rk-qta-btn--primary" data-rk-close></button>'
			+ '</div></div>';
		modal.querySelector('.rk-qta-modal__title').textContent = L.pick || 'Avatar';
		modal.querySelector('.rk-qta-modal__close').setAttribute('aria-label', L.close || 'Close');
		modal.querySelector('[data-rk-clear]').textContent = L.none || 'No avatar';
		modal.querySelector('.rk-qta-btn--primary').textContent = L.done || 'Done';
		document.body.appendChild(modal);

		modal.addEventListener('click', function (e) {
			var t = e.target;
			if (t.closest('[data-rk-clear]')) { e.preventDefault(); select('', true); close(); return; }
			if (t.closest('[data-rk-close]')) { e.preventDefault(); close(); return; }
			var b = t.closest('.rk-qta-opt');
			if (b) { e.preventDefault(); select(b.getAttribute('data-avatar'), true); close(); }
		});
		document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal && !modal.hidden) { e.preventDefault(); close(); } });
	}

	function open() {
		if (!modal) { buildModal(); }
		lastFocus = document.activeElement;
		modal.querySelectorAll('.rk-qta-opt').forEach(function (b) {
			var on = b.getAttribute('data-avatar') === chosen;
			b.classList.toggle('is-selected', on);
			b.setAttribute('aria-selected', on ? 'true' : 'false');
		});
		modal.hidden = false;
		document.documentElement.classList.add('rk-qta-modal-open');
		requestAnimationFrame(function () {
			modal.classList.add('is-open');
			var f = modal.querySelector('.is-selected') || modal.querySelector('.rk-qta-opt');
			if (f) { f.focus(); }
		});
	}

	function close() {
		if (!modal || modal.hidden) { return; }
		modal.classList.remove('is-open');
		document.documentElement.classList.remove('rk-qta-modal-open');
		setTimeout(function () { modal.hidden = true; }, 180);
		if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
	}

	function select(file, save) {
		chosen = byFile[file] ? file : '';
		if (save && opts.remember) {
			try { if (chosen) { localStorage.setItem(KEY, chosen); } else { localStorage.removeItem(KEY); } } catch (e) {}
		}
		document.querySelectorAll('.rk-qta-trigger').forEach(paintTrigger);
		paintComposers();
	}

	function paintTrigger(btn) {
		var img = btn.querySelector('img'), lbl = btn.querySelector('.rk-qta-trigger__label');
		if (chosen) { img.src = byFile[chosen]; img.hidden = false; btn.classList.add('has-avatar'); lbl.textContent = L.change || 'Change avatar'; }
		else { img.removeAttribute('src'); img.hidden = true; btn.classList.remove('has-avatar'); lbl.textContent = L.pick || 'Pick your avatar'; }
	}

	var USER_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

	/* dugme ide na vrh glavnog obrasca (ne u odgovor: izbor je jedan za celu stranu) */
	function buildTrigger(composer) {
		if (composer.dataset.rkAvatar) { return; }
		var main = composer.querySelector('.qt-composer-main');
		if (!main) { return; }
		composer.dataset.rkAvatar = '1';
		var btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'rk-qta-trigger';
		btn.setAttribute('aria-haspopup', 'dialog');
		btn.innerHTML = '<span class="rk-qta-trigger__preview">' + USER_ICON + '<img src="" alt="" width="40" height="40" hidden></span>'
			+ '<span class="rk-qta-trigger__text"><span class="rk-qta-trigger__label"></span>'
			+ '<span class="rk-qta-trigger__hint"></span></span>';
		btn.querySelector('.rk-qta-trigger__hint').textContent = L.optional || 'optional';
		btn.addEventListener('click', function (e) { e.preventDefault(); open(); });
		paintTrigger(btn);
		main.insertBefore(btn, main.firstChild);
	}

	/* ---------------------------------------------------------------- 3. slike u spisku komentara */
	var cache = {}, pending = {}, timer = null;

	function applyComment(el) {
		var id = (el.id || '').replace('comment-', '');
		if (!id) { return; }
		var av = el.querySelector(':scope > .qt-comment-card .qt-comment-avatar') || el.querySelector('.qt-comment-avatar');
		if (!av) { return; }
		if (cache[id] !== undefined) { paint(av, cache[id]); return; }
		pending[id] = 1;
		if (!timer) { timer = setTimeout(flush, 40); }
	}

	function flush() {
		timer = null;
		var ids = Object.keys(pending); pending = {};
		if (!ids.length || !opts.ajax) { return; }
		var x = new XMLHttpRequest();
		x.open('GET', opts.ajax + '&ids=' + ids.join(','), true);
		x.onload = function () {
			var map = {};
			try { var r = JSON.parse(x.responseText); map = (r && r.data && r.data[0]) || {}; } catch (e) {}
			ids.forEach(function (id) { cache[id] = map[id] || ''; });
			scanComments(document);
		};
		x.send();
	}

	function scanComments(root) {
		if (!root.querySelectorAll) { return; }
		if (root.matches && root.matches('.qt-comment[id^="comment-"]')) { applyComment(root); }
		root.querySelectorAll('.qt-comment[id^="comment-"]').forEach(applyComment);
	}

	/* ---------------------------------------------------------------- start */
	function scan(root) {
		if (!root.querySelectorAll) { return; }
		if (opts.picker) {
			if (root.matches && root.matches('.qt-composer:not(.qt-composer--reply)')) { buildTrigger(root); }
			root.querySelectorAll('.qt-composer:not(.qt-composer--reply)').forEach(buildTrigger);
		}
		scanComments(root);
		paintComposers();
	}

	function start() {
		scan(document);
		new MutationObserver(function (muts) {
			muts.forEach(function (m) {
				m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { scan(n); } });
				/* React osveži čvor avatara (npr. posle glasa): vrati sliku */
				if (m.type === 'attributes' && m.target.classList && m.target.classList.contains('qt-avatar')) {
					var url = m.target.dataset.rkAv; if (url && !m.target.style.backgroundImage) { m.target.style.backgroundImage = 'url("' + url + '")'; }
				}
			});
		}).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
	}

	if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }
})();
