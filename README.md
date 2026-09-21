# sbm for Firefox and Chrome

Your [sbm](https://github.com/equwal/sbm) bookmarks in the browser.

- **Search as you type** in the popup (Alt+Shift+B), with the fuzzy match of
  fzf. Enter opens the first match. Text that is no bookmark opens as an
  address, or as a web search, as in bm.
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

The add-on uses https://sbm.subread.space unless you give another server in
the options. Create an account there: it is free for 30 days, then $3 a month
or $30 a year. Or [run your own server](https://github.com/equwal/sbm-sync):
it is free software.

## Permissions

- `storage`: keep the bookmarks and the sign-in token.
- `activeTab`: read the address and the title of the page when you click
  "Add this page".
- `alarms`: sync every 30 minutes.
- Access to sbm.subread.space, or to the server that you choose: sync.

Firefox also asks you, at sign-in, to let the add-on send your bookmarks,
your email address and your password to the server. The
[privacy policy](https://sbm.subread.space/privacy) tells what the server
keeps.

## Develop

The add-on needs no build: load this directory as an unpacked extension
(Chrome: chrome://extensions, developer mode; Firefox: about:debugging).

    npm install
    npm test          # property tests of the file format and the search
    npm run lint      # the checks of addons.mozilla.org
    npm run build     # the zip for the stores, in web-ext-artifacts/

## License

AGPL-3.0. If sbm is useful to you, you can support it on
[Ko-fi](https://ko-fi.com/truex).
