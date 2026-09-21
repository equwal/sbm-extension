// Search as in fzf. Each word of the query must occur in the text, with its
// letters in order but not always together. Case does not matter.
"use strict";

const Fuzzy = (() => {
  const letterOrDigit = /[\p{L}\p{N}]/u;

  function startsWord(hay, i) {
    return i === 0 || !letterOrDigit.test(hay[i - 1]);
  }

  function scoreWord(word, hay) {
    // The whole word in one place scores highest, most at the start of a word.
    const at = hay.indexOf(word);
    if (at >= 0) return 100 + word.length + (startsWord(hay, at) ? 20 : 0);
    let score = 0;
    let previous = -2;
    let from = 0;
    for (const c of word) {
      const i = hay.indexOf(c, from);
      if (i < 0) return null;
      score += 1;
      if (i === previous + 1) score += 5;
      if (startsWord(hay, i)) score += 3;
      previous = i;
      from = i + c.length;
    }
    return score;
  }

  return {
    /** The score of query in text, or null when a word does not occur. Higher is better. */
    score(query, text) {
      const hay = text.toLowerCase();
      let total = 0;
      for (const word of query.toLowerCase().split(/[ \t]/)) {
        if (word === "") continue;
        const s = scoreWord(word, hay);
        if (s === null) return null;
        total += s;
      }
      return total;
    },

    /** The items that match query, best first. Items with the same score keep their order. */
    filter(items, query, text) {
      if (query.trim() === "") return items;
      return items
        .map((item, i) => ({ item, i, s: Fuzzy.score(query, text(item)) }))
        .filter((x) => x.s !== null)
        .sort((a, b) => b.s - a.s || a.i - b.i)
        .map((x) => x.item);
    },
  };
})();

if (typeof module !== "undefined") module.exports = Fuzzy;
