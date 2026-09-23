# Store listings: Chrome Web Store and addons.mozilla.org

Package: `npm run build` makes `web-ext-artifacts/sbm_bookmarks-<version>.zip`.
Upload the same zip to both stores. It has no build step and no minified
code, so no separate source upload is necessary.

The declarations are yours: read each answer before you submit it.

## Texts for both stores

**Name:** sbm bookmarks

**Summary** (132 characters or less):
Your sbm bookmarks in the browser: search as you type, add the page, sync with bm and the sbm app.

**Description:**

sbm keeps your bookmarks in one plain text file: one bookmark per line, with the address, a description and tags. This add-on brings that file to your browser.

- Search as you type: press Alt+Shift+M or click the icon. The search is fuzzy, as in fzf. Enter opens the first match. Text that is no bookmark opens as an address, or as a web search.
- In the address bar, type bm, a space, then words.
- Add the page that you look at, with a description and tags.
- Sync with bm on your computers, the sbm app for Android and your other browsers, through an sbm-sync server. The server is free software: use the default one, sbm.subread.space, or run your own. Sync on sbm.subread.space is free.
- The options page shows the plan of your account and the paid options of the server, such as a supporter subscription. Stripe takes all payments on its own pages. The add-on never sees your card.

Without an account, your bookmarks stay in the browser. The add-on has no ads, no analytics and no trackers.

The operator of sbm.subread.space sells its paid options, not Google or Mozilla. Terms of sale, with the refund policy: https://sbm.subread.space/terms

Source code (AGPL-3.0): https://github.com/equwal/sbm-extension

**Images:** `store/1-list.png`, `2-search.png`, `3-add.png`, `4-sync.png`
(1280x800, demo bookmarks only), icon `icons/128.png`, small promo tile
`store/promo-440x280.png`.

**Homepage:** https://github.com/equwal/sbm-extension
**Support:** https://github.com/equwal/sbm-extension/issues
**Privacy policy:** https://sbm.subread.space/privacy
**Terms of sale:** https://sbm.subread.space/terms (in the description; the
Chrome Web Store asks for them when an add-on leads to payments)

## Chrome Web Store (chrome.google.com/webstore/devconsole)

- Category: Tools. Language: English.
- **Single purpose:** Search, add and sync the sbm bookmarks of the user.
- **Permission justifications:**
  - storage: keeps the bookmarks of the user and the sign-in token in the browser.
  - activeTab: reads the address and the title of the current page when the user clicks "Add this page".
  - alarms: syncs the bookmarks every 30 minutes.
  - Host permission sbm.subread.space: sends the bookmark file to the default sync server after the user signs in.
  - Optional host permissions (https://\*/\*, http://\*/\*): the user can choose another sync server; at sign-in the add-on asks for that one site only.
- **Remote code:** No. All code is in the package.
- **Data usage:** the add-on collects, only after the user signs in:
  personally identifiable information (the email address), authentication
  information (the password, sent once to get a token) and web history (the
  addresses of the bookmarks). Tick the three statements: not sold, not used
  for purposes unrelated to the single purpose, not used for credit.
- Distribution: public, all regions. Free. If the Distribution tab has the
  option "Contains in-app purchases", tick it: the options page leads to
  Stripe subscriptions of the server.

## addons.mozilla.org (addons.mozilla.org/developers)

- Submit "On this site" (listed).
- Categories: Bookmarks, Search Tools.
- License: GNU Affero General Public License v3.0.
- Contributions URL (in "Manage Status & Versions", then "Edit Product
  Page"): https://ko-fi.com/truex. AMO accepts only some sites here:
  ko-fi.com is one, buy.stripe.com is not.
- "This add-on requires payment, non-free services or software, or
  additional hardware": leave it clear while sync is free. Tick it on the
  day that sync on sbm.subread.space needs payment, and change the
  description the same day.
- Data collection: the manifest declares none as required, and bookmarks,
  personally identifying information and authentication information as
  optional. Firefox asks the user at sign-in.
- Notes to reviewer: "No build step: the zip is the source. To test sync,
  open the options, keep the server https://sbm.subread.space and sign in
  with the review account below." Give the account from
  `Desktop\sbm-android-signing\play-review-account.txt` (it holds demo
  bookmarks only).
