# sbm for Firefox and Chrome

Your [sbm](https://github.com/equwal/sbm) bookmarks in the browser.

![bm adds a page in the terminal; the add-on shows it at once and adds another, which bm then shows](https://raw.githubusercontent.com/equwal/sbm-sync/master/demo/sbm-demo.gif)

([MP4](https://github.com/equwal/sbm-sync/raw/master/demo/sbm-demo.mp4), 80 seconds.)

- **Search as you type** in the popup (Alt+Shift+M), with the fuzzy match of
  fzf. Enter opens the highlighted match, first the top one. Text that is no
  bookmark opens as an address, or as a web search, as in bm.
- **Live preview:** the page of the highlighted bookmark shows beside the
  list while you search. The arrow keys and the mouse move the highlight.
  An http page shows with https. Some sites do not let other pages show
  them, so their preview stays empty. Turn the preview off in the options.
- **Address bar:** type `bm`, a space, then words.
- **Add this page** with a description and tags.
- **Sync** with bm on your computers, the
  [sbm app for Android](https://github.com/equwal/sbm-android) and your other
  browsers, through an [sbm-sync](https://github.com/equwal/sbm-sync) server.

Without an account, the bookmarks stay in the browser. With an account, the
add-on syncs when it starts, when you open the popup, after you add a
bookmark, and every 30 minutes.

The bookmarks are an sbm file: one bookmark per line,
`URL<tab>description<tab>tags`.

## Sync

The add-on uses https://sbmsync.com unless you give another server in
the options. Create an account there. Sync on that server is free. Or
[run your own server](https://github.com/equwal/sbm-sync): it is free
software.

The options page shows the plan of your account and the payments that the
server offers. When the server has billing, subscribe there, and use
"Manage billing" to change the card or cancel. The page also links to the
other payment pages of the server, such as a supporter subscription and the
page to cancel it, and to the terms of sale. Stripe takes all payments, on
its own pages in a new tab. The add-on never sees your card.

## Permissions

- `storage`: keep the bookmarks and the sign-in token.
- `activeTab`: read the address and the title of the page when you click
  "Add this page".
- `alarms`: sync every 30 minutes.
- Access to sbmsync.com and its old address sbm.subread.space, or to the
  server that you choose: sync.

Firefox also asks you, at sign-in, to let the add-on send your bookmarks,
your email address and your password to the server. The
[privacy policy](https://sbmsync.com/privacy) tells what the server
keeps.

The live preview needs no permission. It loads the page from its site, as
a visit does, without a referrer. It sends nothing to the sync server.

## Develop

The add-on needs no build: load this directory as an unpacked extension
(Chrome: chrome://extensions, developer mode; Firefox: about:debugging).

    npm install
    npm test          # property tests of the file format, the search and the preview
    npm run lint      # the checks of addons.mozilla.org, on the Firefox package
    npm run build     # the zip for the Chrome Web Store, in web-ext-artifacts/
    npm run build:firefox  # the zip for addons.mozilla.org

The two zips have the same files. Only the manifest.json of the Firefox zip
has no `background.service_worker`: Firefox ignores it and warns about it,
and Chrome needs it.

## License

AGPL-3.0. If sbm is useful to you, you can support it on
[Ko-fi](https://ko-fi.com/truex).
