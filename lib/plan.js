// The plan of an sbm Sync account and the payments that the server offers,
// as the options page shows them. The server gives them at GET /api/account.
// This file has no browser code, so the tests run in node.
"use strict";

const Plan = (() => {
  /** The address as text when its scheme is one of schemes, else "". */
  function web(address, schemes = ["https:", "http:"]) {
    try {
      const u = new URL(address);
      return schemes.includes(u.protocol) ? u.href : "";
    } catch (e) {
      return "";
    }
  }

  return {
    web,

    /** The payment pages of the server and its terms of sale, as links with texts. */
    links(info) {
      return [
        { href: web(info.support), text: "Become a supporter" },
        { href: web(info.manage), text: "Manage or cancel a supporter subscription" },
        { href: web(info.teams), text: "Team bookmarks: up to 10 people" },
        { href: web(info.teams_large), text: "Team bookmarks: 11 people or more" },
        { href: web(info.terms), text: "Terms of sale" },
      ].filter((l) => l.href !== "");
    },
  };
})();

if (typeof module !== "undefined") module.exports = Plan;
