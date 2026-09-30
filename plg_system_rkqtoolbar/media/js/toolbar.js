/* RK: traka za osnovno formatiranje iznad QuillThreads polja za komentar. Radi pored Quill-ovog React koda, ne u njemu.
 * Sintaksa: 'html' (podrazumevano) ili 'markdown'. QuillThreads 1.1.1 u Markdown režimu NE pretvara Markdown u HTML
 * (klijent ne prevodi, server samo propušta dozvoljene HTML oznake), pa traka umeće HTML, koji server prihvata i prikazuje.
 * Uz traku: emodži birač (emoji.js, isti kao u JComments-u) i YouTube dugme sa prozorčićem za vezu (kao u JComments-u);
 * YouTube veze u objavljenim komentarima skripta pretvara u plejer na klik (server ne propušta iframe, pa veza ostaje
 * veza u bazi, a plejer nastaje tek u pregledaču). */
(function () {
	'use strict';

	var opts = (window.Joomla && Joomla.getOptions && Joomla.getOptions('plg_system_rkqtoolbar')) || {};
	var labels = opts.labels || {};
	var wanted = opts.buttons || ['bold', 'italic', 'link', 'quote', 'list', 'code', 'youtube', 'emoji'];
	var syntax = opts.syntax === 'markdown' ? 'markdown' : 'html';

	var YT = /^(?:https?:)?\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

	/* React drži vrednost textarea u svom stanju; direktan el.value = ... ne vidi. Zato native setter + input događaj. */
	var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;

	function setValue(el, value, selStart, selEnd) {
		setter.call(el, value);
		el.dispatchEvent(new Event('input', { bubbles: true }));
		el.focus();
		el.setSelectionRange(selStart, selEnd);
	}

	/* Obmota izbor oznakama; bez izbora ubaci oznake i stavi kursor između. */
	function wrap(el, before, after) {
		var v = el.value, s = el.selectionStart, e = el.selectionEnd;
		var sel = v.slice(s, e);
		var out = v.slice(0, s) + before + sel + after + v.slice(e);
		var a = s + before.length;
		setValue(el, out, a, a + sel.length);
	}

	function insertAt(el, text) {
		var v = el.value, s = el.selectionStart, e = el.selectionEnd;
		var out = v.slice(0, s) + text + v.slice(e);
		setValue(el, out, s + text.length, s + text.length);
	}

	/* Markdown: prefiks na početak svakog izabranog reda (> ili - ). */
	function prefixLines(el, prefix) {
		var v = el.value, s = el.selectionStart, e = el.selectionEnd;
		var ls = v.lastIndexOf('\n', s - 1) + 1;
		var le = v.indexOf('\n', e); if (le === -1) { le = v.length; }
		var lines = v.slice(ls, le).split('\n').map(function (l) { return l.indexOf(prefix) === 0 ? l : prefix + l; });
		var out = v.slice(0, ls) + lines.join('\n') + v.slice(le);
		setValue(el, out, ls, ls + lines.join('\n').length);
	}

	/* HTML: svaki izabrani red postane <li>, ceo blok <ul>. */
	function htmlList(el) {
		var v = el.value, s = el.selectionStart, e = el.selectionEnd;
		var ls = v.lastIndexOf('\n', s - 1) + 1;
		var le = v.indexOf('\n', e); if (le === -1) { le = v.length; }
		var items = v.slice(ls, le).split('\n').filter(function (l) { return l.trim() !== ''; });
		if (!items.length) { items = ['']; }
		var block = '<ul>\n' + items.map(function (l) { return '<li>' + l.trim() + '</li>'; }).join('\n') + '\n</ul>';
		var out = v.slice(0, ls) + block + v.slice(le);
		setValue(el, out, ls, ls + block.length);
	}

	/* Veza: izabrani tekst postaje tekst veze, kursor na adresu da se odmah kuca (ili nalepi). */
	function linkWith(el, defaultText, url) {
		var v = el.value, s = el.selectionStart, e = el.selectionEnd;
		var text = v.slice(s, e) || defaultText;
		var out, a;
		if (syntax === 'markdown') {
			out = v.slice(0, s) + '[' + text + '](' + url + ')' + v.slice(e);
			a = s + text.length + 3;
		} else {
			out = v.slice(0, s) + '<a href="' + url + '">' + text + '</a>' + v.slice(e);
			a = s + 9;
		}
		setValue(el, out, a, a + url.length);
	}
	function link(el) { linkWith(el, labels.linkText || 'tekst', 'https://'); }

	/* YouTube: prozorčić za vezu (kao u JComments-u), pa gotova veza u tekst; izabrani tekst postaje tekst veze. */
	function youtube(el) {
		var s = el.selectionStart, e = el.selectionEnd, sel = el.value.slice(s, e);
		var u = window.prompt(labels.youtubePrompt || 'Nalepite vezu ka YouTube videu:', '');
		if (u === null) { el.focus(); return; }
		u = u.trim();
		if (!u) { el.focus(); return; }
		if (!YT.test(u)) { window.alert(labels.youtubeBad || 'Ovo ne izgleda kao YouTube veza.'); el.focus(); return; }
		var text = sel || labels.youtubeText || 'YouTube video';
		var tag = syntax === 'markdown' ? '[' + text + '](' + u + ')' : '<a href="' + u + '">' + text + '</a>';
		var out = el.value.slice(0, s) + tag + el.value.slice(e);
		setValue(el, out, s + tag.length, s + tag.length);
	}

	/* Emodži birač iz emoji.js (isti kao na JComments-u); pravi se pri prvom kliku, lebdi ispod trake. */
	function emojiPicker(el, button) {
		if (!window.rkQtEmoji) { return; }
		if (!button.rkPicker) {
			var host = el.parentNode;
			host.classList.add('rk-qt-host');
			button.rkPicker = window.rkQtEmoji.create(host, function (ch) { insertAt(el, ch); }, button);
		}
		button.rkPicker.toggle();
	}

	/* icon = tekst na dugmetu; prazan tekst = ikonica iz CSS-a (klasa rk-qt-btn-<ime>) */
	var actions = syntax === 'markdown' ? {
		bold:   { icon: 'B', run: function (el) { wrap(el, '**', '**'); }, key: 'b' },
		italic: { icon: 'I', run: function (el) { wrap(el, '_', '_'); }, key: 'i' },
		link:   { icon: '', run: link, key: 'k' },
		quote:  { icon: '', run: function (el) { prefixLines(el, '> '); } },
		list:   { icon: '', run: function (el) { prefixLines(el, '- '); } },
		code:   { icon: '</>', run: function (el) { wrap(el, '`', '`'); } },
		youtube: { icon: '', run: youtube },
		emoji:  { icon: '', run: emojiPicker }
	} : {
		bold:   { icon: 'B', run: function (el) { wrap(el, '<strong>', '</strong>'); }, key: 'b' },
		italic: { icon: 'I', run: function (el) { wrap(el, '<em>', '</em>'); }, key: 'i' },
		link:   { icon: '', run: link, key: 'k' },
		quote:  { icon: '', run: function (el) { wrap(el, '<blockquote>', '</blockquote>'); } },
		list:   { icon: '', run: htmlList },
		code:   { icon: '</>', run: function (el) { wrap(el, '<code>', '</code>'); } },
		youtube: { icon: '', run: youtube },
		emoji:  { icon: '', run: emojiPicker }
	};

	function build(textarea) {
		if (textarea.dataset.rkToolbar) { return; }
		textarea.dataset.rkToolbar = '1';

		var bar = document.createElement('div');
		bar.className = 'rk-qt-toolbar';
		bar.setAttribute('role', 'toolbar');
		bar.setAttribute('aria-label', labels.hint || syntax);

		wanted.forEach(function (name) {
			var a = actions[name];
			if (!a) { return; }
			var b = document.createElement('button');
			b.type = 'button';
			b.className = 'rk-qt-btn rk-qt-btn-' + name;
			b.title = labels[name] || name;
			b.setAttribute('aria-label', labels[name] || name);
			b.textContent = a.icon;
			/* mousedown umesto click: da textarea ne izgubi izbor pre nego što ga pročitamo */
			b.addEventListener('mousedown', function (ev) { ev.preventDefault(); a.run(textarea, b); });
			bar.appendChild(b);
		});

		var hint = document.createElement('span');
		hint.className = 'rk-qt-hint';
		hint.textContent = labels.hint || syntax;
		bar.appendChild(hint);

		textarea.parentNode.insertBefore(bar, textarea);

		textarea.addEventListener('keydown', function (ev) {
			if (!(ev.ctrlKey || ev.metaKey) || ev.altKey) { return; }
			var k = ev.key.toLowerCase();
			for (var name in actions) {
				if (actions[name].key === k && wanted.indexOf(name) !== -1) {
					ev.preventDefault();
					actions[name].run(textarea);
					return;
				}
			}
		});
	}

	/* YouTube veze u objavljenim komentarima -> plejer na klik (sličica sa YouTube-a, iframe tek posle klika). */
	function embedYoutube(a) {
		if (a.dataset.rkYt) { return; }
		var m = YT.exec(a.getAttribute('href') || '');
		if (!m) { return; }
		a.dataset.rkYt = '1';
		var id = m[1];
		var box = document.createElement('div');
		box.className = 'rk-qt-yt';
		var btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'rk-qt-yt-play';
		btn.setAttribute('aria-label', labels.youtubePlay || 'YouTube');
		btn.style.backgroundImage = 'url(https://i.ytimg.com/vi/' + id + '/hqdefault.jpg)';
		btn.addEventListener('click', function () {
			var f = document.createElement('iframe');
			f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1';
			f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
			f.setAttribute('allowfullscreen', '');
			f.title = a.textContent || 'YouTube';
			box.replaceChild(f, btn);
		});
		box.appendChild(btn);
		a.parentNode.insertBefore(box, a.nextSibling);
		/* tekst veze („YouTube video") otvara modal preko cele širine; sličica ispod pušta u komentaru */
		a.addEventListener('click', function (ev) { ev.preventDefault(); openYtModal(id, a.textContent || 'YouTube'); });
	}

	/* Modal sa plejerom (Gagi 30.09: klik na tekst veze -> modal, sličica ostaje u komentaru). */
	var ytModal = null;

	function openYtModal(id, title) {
		if (!ytModal) {
			ytModal = document.createElement('div');
			ytModal.className = 'rk-qt-ytmodal';
			ytModal.setAttribute('role', 'dialog');
			ytModal.setAttribute('aria-modal', 'true');
			ytModal.innerHTML = '<div class="rk-qt-ytmodal__backdrop" data-rk-ytclose></div>'
				+ '<div class="rk-qt-ytmodal__box"><button type="button" class="rk-qt-ytmodal__close" data-rk-ytclose aria-label="' + (labels.close || 'Zatvori') + '">&times;</button>'
				+ '<div class="rk-qt-ytmodal__frame"></div></div>';
			ytModal.hidden = true;
			document.body.appendChild(ytModal);
			ytModal.addEventListener('click', function (ev) { if (ev.target.closest('[data-rk-ytclose]')) { ev.preventDefault(); closeYtModal(); } });
			document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && ytModal && !ytModal.hidden) { closeYtModal(); } });
		}
		var f = document.createElement('iframe');
		f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1';
		f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
		f.setAttribute('allowfullscreen', '');
		f.title = title;
		var holder = ytModal.querySelector('.rk-qt-ytmodal__frame');
		holder.innerHTML = '';
		holder.appendChild(f);
		ytModal.setAttribute('aria-label', title);
		ytModal.hidden = false;
		document.documentElement.classList.add('rk-qt-ytmodal-open');
		requestAnimationFrame(function () { ytModal.classList.add('is-open'); });
	}

	function closeYtModal() {
		if (!ytModal || ytModal.hidden) { return; }
		ytModal.classList.remove('is-open');
		document.documentElement.classList.remove('rk-qt-ytmodal-open');
		ytModal.querySelector('.rk-qt-ytmodal__frame').innerHTML = ''; /* gasi video */
		setTimeout(function () { ytModal.hidden = true; }, 180);
	}

	var SEL_TA = 'textarea.qt-composer-input';
	var SEL_YT = '.qt-comment-body a[href*="youtu"]';

	/* Posmatrač javlja i sam dodati čvor, pa proveravamo i njega, ne samo potomke. */
	function scan(root) {
		if (!root.querySelectorAll) { return; }
		if (root.matches && root.matches(SEL_TA)) { build(root); }
		root.querySelectorAll(SEL_TA).forEach(build);
		if (root.matches && root.matches(SEL_YT)) { embedYoutube(root); }
		root.querySelectorAll(SEL_YT).forEach(embedYoutube);
	}

	function start() {
		scan(document);
		/* Quill iscrtava obrazac i komentare kasnije (React), i ponovo pri odgovoru: pratimo DOM. */
		new MutationObserver(function (muts) {
			muts.forEach(function (m) {
				m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { scan(n); } });
			});
		}).observe(document.body, { childList: true, subtree: true });
	}

	if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }
})();
