'use strict';

const AWS = require('aws-sdk');
const util = require('util');

const Librus = require("../librus-api");

var ses = new AWS.SES();

function sendEmail(content, callback) {
   var params = {
         Destination: {
                        ToAddresses: [process.env.EMAIL_TO]
                      },
         Message: {
            Body: {
               Text: {
                  Data: content
               }
            },
            Subject: {
               Data: "Test 1849"
            }
         },
         Source: process.env.EMAIL_FROM
   }
   
   ses.sendEmail(params, callback);
}

exports.myHandler = function(event, context, callback) {
  let lib = new Librus();
  lib.authorize(process.env.LIBRUS_USER_NAME, process.env.LIBRUS_PASSWORD).then(function () {
    lib.inbox.listInbox(5).then( data => {
      sendEmail(util.inspect(data, null, true) +"\n\n-- Sent by "+context.functionName, 
         function(err, data) {
           if(err) console.log(err);
           else {
             console.log("===EMAIL SENT===");
             console.log(data);
             console.log("EMAIL CODE END");
             context.succeed(event)
           }
         })
     })
  });

}

