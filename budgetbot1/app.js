/** Firebase **/
// // Set the configuration for your app
var firebase = require("firebase");
var firebaseConfig = {
    apiKey: "AIzaSyCELoOXbsTb6AB8G9FtXuMa-bMD757_LSI",
    authDomain: "budgetbot2-80642.firebaseapp.com",
    databaseURL: "https://budgetbot2-80642.firebaseio.com",
    projectId: "budgetbot2-80642",
    storageBucket: "",
    messagingSenderId: "480275482688"
};
firebase.initializeApp(firebaseConfig);
//Get a reference to the database service
//works up to here

firebase.database().ref('users/Chris').set({
    goals: "goal1",
    budget: "$100"
});





function writeUserData(userId) {
  firebase.database().ref().set("budgetbot-380cc/User:/" + "testing");
}

//works up to here
//var u = firebase.database().ref();
//var USERS = firebase.database().ref().set('Users');
//var USERS = firebase.database().ref().child('Users');
//var user_ref = r.child('User');

// firebase.database().ref().set({
//     User: "Elaine"
//   });

// var root = database.ref();
// var usersRef = root.child("users");
// usersRef.set({
//   JC: {
//     goals: "My goal"
//   },
//   Elaine: {
//     goals: "Yes"
//   }
// });

var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

var user_set_goal = false;
var goal;
var user_set_goal_cost = false;
var cost;
var tips = ["Food accounts for 23% of teen spending. Try to be conscious of that before going out to eat!",
"Every dollar you save is a dollar that you can use to reach your goal!",
"Some places give discounts to students if they have their id. It doesn't hurt to ask stores if they have a student discount!",
"Look online for coupons! There are many coupons if you look for them.",
"Do DIY projects! Not only is it fun but it saves money!"];

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

// Server index page
app.get("/", function (req, res) {
  res.send("Deployed!");
});

// Facebook Webhook
// Used for verification
app.get("/webhook", function (req, res) {
  if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
    console.log("Verified webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Verification failed. The tokens do not match.");
    res.sendStatus(403);
  }
});

// All callbacks for Messenger will be POST-ed here
app.post("/webhook", function (req, res) {
  // Make sure this is a page subscription
  if(user_set_goal){
    user_set_goal = false;
    mainGoal(event.ender.id);
    return;
  }

  if (req.body.object == "page") {
    // Iterate over each entry
    // There may be multiple entries if batched
    req.body.entry.forEach(function(entry) {
      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.postback) {
          processPostback(event);
        } else if (event.message) {
          processMessage(event);
        }
      });
    });

    res.sendStatus(200);
  }
});

//changed here

function getTip(senderId){
  sendMessage(senderId, {text: tips[Math.floor(Math.random()*tips.length)]});
}

function mainGoal(senderId){
  sendMessage(senderId, {text: "You've set a goal"});
}
function setGoal(event){
  goalsAndCost[goal] = 0;
}

function setCost(goal, cost){
  goalsAndCost[goal] = cost;
}

//end changes

function processPostback(event) {
  var senderId = event.sender.id;
  var payload = event.postback.payload;

  if (payload === "Greeting") {
    // Get user's first name from the User Profile API
    // and include it in the greeting
    request({
      url: "https://graph.facebook.com/v2.6/" + senderId,
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN,
        fields: "first_name"
      },
      method: "GET"
    }, function(error, response, body) {
      var greeting = "";
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var bodyObj = JSON.parse(body);
        name = bodyObj.first_name;
        greeting = "Hi " + name + "! ";
      }
      var message = greeting + "My name is BudgetBot, your personal finance assistant.";
      sendMessage(senderId, {text: message});
      wait(1000);
      var message2 = "You can start a goal to set your money-saving goal, see your spending history, or hear some finance tips.";
      sendMessage(senderId, {text: message2});
    });
  }
}

function processMessage(event) {
  if (!event.message.is_echo) {
    var message = event.message;
    var senderId = event.sender.id;

    console.log("Received message from senderId: " + senderId);
    console.log("Message is: " + JSON.stringify(message));

    // You may get a text or attachment but not both
    if (message.text) {
      var formattedMsg = message.text.toLowerCase().trim();

      // If we receive a text message, check to see if it matches any special
      // keywords and send back the corresponding movie detail.
      // Otherwise, search for new movie.
      var keyword = getKeyword(formattedMsg);
      switch (keyword) {
        case "goal": // if formattedMsg contains goal
        	sendMessage(senderId, {text: "Great! What do you want to save for?"});
          break;
        case "history":
        	sendMessage(senderId, {text: "Here's your historical spending data:"});
            sendMessage(senderId, {text: "http://tinyurl.com/y9gqjtby"});
          break;
        case "tip":
          getTip(senderId);
          break;
        case "help":
          sendMessage(senderId, {text: "goal: which allows you to set your goal,"});
          sendMessage(senderId, {text: "tip: which gives you some tips to save money"});
          sendMessage(senderId, {text: "add: add a purchase to history"});
          sendMessage(senderId, {text: "history: which allows you to see your past transactions"});
          break;
        case "add":
          sendMessage(senderId, {text: "Add a purchase to history."});
          break;
        case "car":
          sendMessage(senderId, {text: "Sweet! Your goal is saved."});
          break;
        case "boba":
          sendMessage(senderId, {text: "Added to history!"});
          break;
        default:
            /*
            rf.on("value", function(snapshot){
              sendMessage(snapshot.val());
            }, function(errorObject) {
              sendMessage(senderId, {text: errorObject.code});
            });
*/

            // var u = d.child('Users').val();
            //sendMessage(senderId, {text: u});
            //sendMessage(senderId, {text: root});
          	sendMessage(senderId, {text: "Default message here. :/"});
      }
    } else if (message.attachments) {
      sendMessage(senderId, {text: "You have scanned a receipt."});
    }
  }
}

var COMMANDS = ["goal", "add", "history", "tip", "help", "car", "boba"];
function getKeyword(formattedMsg) {
  var i = 0;
  while (formattedMsg.indexOf(COMMANDS[i]) === -1 && i < COMMANDS.length) {
    i++;
  }
  if (i < COMMANDS.length) {
    return COMMANDS[i];
  } else {
    return "";
  }
}


// sends message to user
function sendMessage(recipientId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message: message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: " + response.error);
    }
  });
}

// sends message to user
function sendHistory(recipientId) {
    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: "POST",
        json: {
            recipient: {id: recipientId},
            message: "http://thismatter.com/economics/images/gdp-2005-2010-bar-graph.png"
        }
    }, function(error, response, body) {
        if (error) {
            console.log("Error sending message: " + response.error);
        }
    });
}

function wait(ms) {
  var d = new Date();
  var d2 = null;
  do { d2 = new Date(); }
  while(d2-d < ms);
}
