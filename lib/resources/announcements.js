"use strict";

const Resource = require("../tools.js").Resource;

/**
 * Announcements tab class
 * https://synergia.librus.pl/ogloszenia
 * @type {Announcements}
 */
module.exports = class Announcements extends Resource {
  /**
   * List all announcements on the noticeboard.
   *
   * Each announcement is rendered as its own <table class="decorated big ...">
   * on the listing page, with title in <thead> and a small key/value <tbody>
   * (Dodał / Data publikacji / Treść). The full content is already inline on
   * the listing — there is no per-announcement detail URL.
   *
   * Read/unread: Librus does not expose a per-row "seen" flag we can rely on
   * (the bold-title heuristic misclassified). Instead we read the unread
   * count from the menu bar — the #icon-ogloszenia link carries a title
   * "Liczba nieprzeczytanych ogłoszeń: N" when N > 0 — and mark the first N
   * rows as unread (the listing is newest-first).
   *
   * @returns {Promise<Array>}
   */
  listAnnouncements() {
    let unreadCount = null;
    let rowIndex = 0;
    return this.api._mapper(
        "ogloszenia"
      , "div#body div.container-background table.decorated.big"
      , ($, row) => {
        if (unreadCount === null) {
          let title = $("div#graphic-menu a#icon-ogloszenia").attr("title") || "";
          let m = title.match(/(\d+)/);
          unreadCount = m ? parseInt(m[1], 10) : 0;
          console.log(
            "Announcements: menu bar reports " + unreadCount + " unread"
            + " (title=\"" + title + "\")"
          );
        }
        let myIndex = rowIndex++;
        let parsed = {
            title: ""
          , user: ""
          , date: ""
          , content: ""
          , html: ""
          , read: myIndex >= unreadCount
          , unrecognizedLabels: []
        };

        try {
          let titleCell = $(row).find("thead td").first();
          parsed.title = titleCell.trim();

          $(row).find("tbody tr").each((_, tr) => {
            let label = $(tr).find("th").trim();
            let td = $(tr).find("td").first();
            if (label === "Dodał") {
              parsed.user = $(td).trim();
            } else if (label === "Data publikacji") {
              parsed.date = $(td).trim();
            } else if (label === "Treść") {
              parsed.content = $(td).trim();
              parsed.html = $(td).html();
            } else if (label) {
              parsed.unrecognizedLabels.push(label);
            }
          });

          if (parsed.unrecognizedLabels.length) {
            console.log(
              "Announcements parser: unrecognized label(s) for '"
              + parsed.title + "': " + parsed.unrecognizedLabels.join(", ")
            );
          }

          if (!parsed.title || !parsed.date) {
            console.log(
              "Announcements parser: missing required field(s) "
              + "(title='" + parsed.title + "', date='" + parsed.date + "')"
            );
          }
        } catch (err) {
          console.log("Announcements parser error: " + (err && err.stack || err));
          return null;
        }

        return parsed;
      });
  }
};
