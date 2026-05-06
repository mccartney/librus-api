'use strict';

const AWS = require('aws-sdk');
const util = require('util');

const Librus = require(".");

var ses = new AWS.SES();

function sendEmail(subject, content, event, context) {
   var params = {
         Destination: {
                        ToAddresses: [process.env.EMAIL_TO]
                      },
         Message: {
            Body: {
               Html: {
                  Charset: "UTF-8",
                  Data: content + "<br/><br/>-- <br/>Sent by "+context.functionName
               }
            },
            Subject: {
               Data: subject
            }
         },
         Source: process.env.EMAIL_FROM
   }

   ses.sendEmail(params,
         function(err, data) {
           if(err) console.log("SES sendEmail error for '" + subject + "': " + err);
           else {
             console.log("SES sendEmail OK for '" + subject + "'");
             context.succeed(event)
           }
         })
}

function inspectMessage(msg, librus, event, context) {
  console.log("Processing message " + util.inspect(msg));
  if (!msg.read) {
    librus.inbox.getMessage(5, msg.id).then(data => {
      var from = data.user+"("
      var fromFriendly = from.substring(0, from.indexOf('(')).trim()

      console.log("Sending email about " + data.title);
      sendEmail("Librus ("+fromFriendly+"): " + data.title, data.html, event, context)
    });
  }
}

/**
 * Emits one email per unread announcement. Each announcement is rendered
 * into its own SES call — never combined — even though Librus serves them
 * on a single /ogloszenia page.
 */
function inspectAnnouncement(ann, event, context) {
  console.log("Processing announcement " + util.inspect({
      title: ann && ann.title
    , user: ann && ann.user
    , date: ann && ann.date
    , read: ann && ann.read
    , contentLength: (ann && ann.content || "").length
  }));
  if (!ann) {
    console.log("Announcement is null/undefined, skipping");
    return;
  }
  if (ann.read) {
    return;
  }
  try {
    var user = ann.user || "?";
    var title = ann.title || "(bez tytułu)";
    var subject = "Librus ogłoszenie (" + user + "): " + title;
    var body = (ann.html || ann.content || "")
      + "<br/><br/>-- <br/>Opublikowano: " + (ann.date || "?")
      + "<br/>Dodał: " + user;
    console.log("Sending email about announcement '" + title + "' (date " + (ann.date || "?") + ")");
    sendEmail(subject, body, event, context);
  } catch (err) {
    console.log("inspectAnnouncement error for '" + (ann && ann.title) + "': "
      + (err && err.stack || err));
  }
}

function handleInbox(lib, event, context) {
  return lib.inbox.listInbox(5)
    .then(data => {
      var total = data ? data.length : 0;
      var unread = data ? data.filter(function(m) { return m && !m.read; }).length : 0;
      console.log("Inbox: fetched " + total + " messages (" + unread + " unread)");
      if (!data) return;
      data.forEach(function(value) { return inspectMessage(value, lib, event, context); });
    })
    .catch(err => {
      console.log("Inbox flow failed: " + (err && err.stack || err));
    });
}

function handleAnnouncements(lib, event, context) {
  if (!lib.announcements || typeof lib.announcements.listAnnouncements !== "function") {
    console.log("Announcements module not loaded, skipping");
    return Promise.resolve();
  }
  return lib.announcements.listAnnouncements()
    .then(data => {
      var total = data ? data.length : 0;
      var unread = data ? data.filter(function(a) { return a && !a.read; }).length : 0;
      console.log("Announcements: fetched " + total + " (" + unread + " unread)");
      if (!data || !data.length) return;
      data.forEach(function(a) {
        try {
          inspectAnnouncement(a, event, context);
        } catch (err) {
          console.log("Announcement processing error for '"
            + (a && a.title) + "': " + (err && err.stack || err));
        }
      });
    })
    .catch(err => {
      console.log("Announcements flow failed (inbox flow is independent, so messages "
        + "should still be delivered): " + (err && err.stack || err));
    });
}

exports.myHandler = function(event, context, callback) {
  let lib = new Librus();
  lib.authorize(process.env.LIBRUS_USER_NAME, process.env.LIBRUS_PASSWORD).then(function () {
    // Sequence inbox before announcements so logs appear in a stable order:
    // wiadomości → menu-bar dump (emitted by the announcements parser on the
    // /ogloszenia response) → ogłoszenia rows. Each handler swallows its own
    // errors, so a failing inbox still lets announcements run.
    return handleInbox(lib, event, context)
      .then(() => handleAnnouncements(lib, event, context));
  }).catch(err => {
    console.log("Authorize failed: " + (err && err.stack || err));
  });

}

