// The live preview of the popup: the page of the highlighted bookmark shows
// in a frame beside the list. This file has no browser code, so the tests
// run in node.
"use strict";

const Preview = {
  /**
   * The address that the frame loads for the URL of a bookmark, or null when
   * the page cannot show in a frame. Only web pages can show. An http:// page
   * loads as https://, because the popup is a secure page, and a secure page
   * cannot show an insecure frame.
   */
  address(url) {
    let u;
    try {
      u = new URL(url);
    } catch (e) {
      return null;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.protocol = "https:";
    return u.href;
  },

  /** The row that is highlighted after a move of step rows from row i, in a list of n rows. */
  move(i, step, n) {
    return Math.max(0, Math.min(n - 1, i + step));
  },
};

if (typeof module !== "undefined") module.exports = Preview;
