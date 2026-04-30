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
   * Read/unread: Librus does not expose an explicit "seen" flag in the HTML
   * we've observed so far. We mirror the inbox convention (font-weight: bold
   * marks unread) on the title cell as a best-effort heuristic. If the parse
   * below ever misclassifies, tweak the read-detection in one place.
   *
   * @returns {Promise<Array>}
   */
  listAnnouncements() {
    return this.api._mapper(
        "ogloszenia"
      , "div#body div.container-background table.decorated.big"
      , ($, row) => {
        let parsed = {
            title: ""
          , user: ""
          , date: ""
          , content: ""
          , html: ""
          , read: true
          , unrecognizedLabels: []
        };

        try {
          let titleCell = $(row).find("thead td").first();
          parsed.title = titleCell.trim();

          let titleStyle = titleCell.attr("style") || "";
          if (titleStyle.indexOf("font-weight: bold") !== -1) {
            parsed.read = false;
          }

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
