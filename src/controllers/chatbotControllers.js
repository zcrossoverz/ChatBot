const { response } = require('express');
const request = require('request');
require("dotenv").config();
const TOKEN = process.env.TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

let getHomePage = (req, res) => {
  return res.send("Xin chao");
};
let getWebHook = (req, res) => {
  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

let postWebHook = (req, res) => {
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === "page") {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
};


let handleMessage = (sender_psid, received_message) => {
  let response;
  // if (command(received_message.text) != 0) {
  //   response = {
  //     text: `${command(received_message.text)}`,
  //   };
  //   callSendAPI(sender_psid, response);
  //   console.log('Command :'+command(received_message.text));
  // } else {
    // Check if the message contains text
    if (received_message.text) {
      request(
        {
          uri:
            "https://simsumi.herokuapp.com/api?text=" +
            encodeURI(received_message.text) +
            "&lang=vi_VN",
          method: "GET",
        },
        (err, res, body) => {
          console.log("err: " + err);
          console.log("res: " + res);
          console.log("body: " + body);

          if (!err) {
            if (JSON.parse(body).success == "Limit 50 queries per hour.") {
              response = {
                text: `Em mệt rồi :( đợi thêm 1 tiếng nữa em rep`,
              };
              callSendAPI(sender_psid, response);
            } else {
              response = {
                text: `${JSON.parse(body).success}`,
              };
              callSendAPI(sender_psid, response);
            }
          } else {
            console.log("-------------------------");
            console.error("Error: " + err);
            console.log("-------------------------");
            // response = {
            //   text: `"Sim đang bị ốm :( Cần anh Nhân fix lại ạ"`,
            // };
            // callSendAPI(sender_psid, response);
          }
        }
      );
      // Create the payload for a basic text message
    }

    // Sends the response message
  //}
};

  // let command = (text) => {
  //   switch(text){
  //     case 'getlist':
  //       getListCmd();
  //       break;
  //     default:
  //       return 0;
  //   }
  // }


  // let getListCmd = ()=>{
  //   return 'hello em';
  // }

  let callSendAPI = (sender_psid, response) => {
    // Construct the message body
    let request_body = {
      recipient: {
        id: sender_psid,
      },
      message: response,
    };

    // Send the HTTP request to the Messenger Platform
    request(
      {
        uri: "https://graph.facebook.com/v2.6/me/messages",
        qs: { access_token: TOKEN },
        method: "POST",
        json: request_body,
      },
      (err, res, body) => {
        if (!err) {
          console.log("message sent!");
          console.log('response : '+res);
          console.log('body: '+body);
        } else {
          console.error("Unable to send message:" + err);
        }
      }
    );
  };

module.exports = {
  getHomePage: getHomePage,
  getWebHook: getWebHook,
  postWebHook: postWebHook,
};
