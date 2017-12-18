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
           if(err) console.log(err);
           else {
             context.succeed(event)
           }
         })
}

function inspectMessage(msg, librus, event, context) {
  if (!msg.read) {
    librus.inbox.getMessage(5, msg.id).then(data => {
      var from = data.user+"("
      var fromFriendly = from.substring(0, from.indexOf('(')).trim()
      
      sendEmail("Librus ("+fromFriendly+"): " + data.title, data.html, event, context)
    });
  }
}


exports.myHandler = function(event, context, callback) {
  let lib = new Librus();
  lib.authorize(process.env.LIBRUS_USER_NAME, process.env.LIBRUS_PASSWORD).then(function () {
    lib.inbox.listInbox(5).then( data => {
    
      data.forEach(function(value) { return inspectMessage(value, lib, event, context)})
   })   
  });

}

