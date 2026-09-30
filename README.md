# Two QuillThreads add-ons from Radnicka Klasa (30 Sep 2026)

Both are ordinary Joomla **system plugins**. They do not modify any QuillThreads file; they work
next to the React front end (MutationObserver on the DOM) and hook the events the component already
dispatches. Tested on Joomla 6.1.2, PHP 8.5, QuillThreads 1.1.1. Screenshots are in `screenshots/`, installable zips in `dist/`.

## 1. plg_system_rkqtoolbar 1.1.0: composer toolbar, emoji picker, YouTube

What the visitor sees (screenshots 01, 03, 04, 05):

- A toolbar above `textarea.qt-composer-input`: **B**, *I*, link, quote, list, code, YouTube, emoji.
  Keyboard: Ctrl+B / Ctrl+I / Ctrl+K.
- **Emoji**: a picker with 8 categories, search by keyword (Serbian keywords in our data file),
  a "Recent" row (localStorage) and a tooltip with the name. Click inserts at the caret.
- **YouTube**: asks for the link (browser prompt), validates it, inserts `<a href="...">YouTube video</a>`.
  In published comments every YouTube link (`.qt-comment-body a[href*="youtu"]`) gets a click-to-play
  thumbnail (youtube-nocookie iframe only after the click) and the link text opens the video in a modal.

How it is wired:

- `onBeforeCompileHead`: loads only on `com_content` HTML pages when `com_quillthreads` is enabled and
  `#__quillthreads_settings.formatting` is `markdown` or `limited_html`.
- Values are written through the React native setter + `input` event, so the composer state, the
  counter and the preview see the change as if it were typed.
- Plugin options: which buttons, and which markup the buttons insert (HTML by default, see below).

## 2. plg_system_rkqtavatar 1.0.0: avatar gallery for guests and users

What the visitor sees (screenshots 01, 02, 06):

- A "Pick your avatar" button at the top of the composer opens a gallery (any images from a folder,
  default `images/quillthreads/avatars`). The choice is remembered in the browser.
- The composer avatar (the initials circle) shows the chosen image at once.
- In the thread every comment shows an image: the one the author picked, or, for comments without a
  choice, a stable one derived from the author name / user id (same author, same avatar).

How it is wired:

- The script adds `rk_avatar` to the JSON body of the `task=comments.create` request (XHR/fetch wrapper).
- On `onQuillthreadsCommentAfterCreate` the plugin reads `php://input`, validates the file name against
  the gallery and stores it in its own table `#__quillthreads_rkavatar (comment_id, avatar)`;
  `onQuillthreadsCommentAfterDelete` removes the row. The plugin implements `SubscriberInterface`
  because a legacy plugin method would get no arguments from `CommentEvent`.
- The component always returns `author.avatar = null`, so the images are applied in the browser:
  the script collects `id="comment-N"` nodes, asks `com_ajax` (`onAjaxRkqtavatar`, `ids=1,2,3`) for the
  URLs and sets them as the background of your `.qt-avatar` node (data attribute + inline style, the
  node stays yours so React keeps working).

## Why we are sending this

Everything above works around the fact that the front end has no extension points: no hook to add
controls to the composer, no hook for the avatar, no way to pass extra fields with the comment.
If any of it is useful, please take it into QuillThreads; that is what we would prefer, because our
plugins depend on your DOM class names (`qt-composer-input`, `qt-comment`, `qt-avatar`), the JSON
envelope and the event names, and will break whenever those change.

## One bug we found on the way

With **Formatting = Markdown**, Markdown is never rendered: the client does not convert it and
`SanitizerService::render('markdown')` only allowlists HTML tags, so `**bold**` is shown literally.
That is why our toolbar inserts HTML tags (the `syntax` option has a Markdown mode for the day the
component renders it).

## Install

Extensions > Install, then enable both plugins (System group). For the avatar plugin create the
gallery folder (`images/quillthreads/avatars`) and put your PNG/WebP/SVG files there. Both plugins
ship en-GB and sr-YU language files.
