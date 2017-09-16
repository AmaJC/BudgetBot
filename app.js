/** Firebase **/
// // Set the configuration for your app
var firebase = require("firebase");
var firebaseConfig = {
  apiKey: "AIzaSyAnB_k77LGv2NzwUX7kFud-HHf2Z5puESE",  // Firebase Console > Project > Settings > Web API Key
  authDomain: "budgetbot-380cc.firebaseapp.com",
  databaseURL: "https://budgetbot-380cc.firebaseio.com", // This chatbot only utilizes Firebase RTDB
  storageBucket: "budgetbot-380cc.appspot.com"
};
firebase.initializeApp(firebaseConfig);
//Get a reference to the database service
//works up to here

var root = firebase.database().ref('users/');
root.set({
  JC: {
    goals: "My goal"
  },
  Elaine: {
    goals: "Yes"
  }
});

var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

var user_set_goal = "c:/user_set_goal.txt";
var goalsAndCost = "c:/goalsAndCost.txt";
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
    user_set_goal.open("r");
    var str = file.readln();
    user_set_goal.close();
  if(str){
    user_set_goal.open("w");
    user_set_goal.write(("").getBytes());
    user_set_goal.write("false");
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
function setGoal(goal){
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
          user_set_goal = true;
        	sendMessage(senderId, {text: "Great! What do you want to save for?"});
          break;
        case "history":
        	sendMessage(senderId, {text: "Showing history."});
          break;
        case "tip":
          getTip(senderId);
          break;
        case "help":
        	sendMessage(senderId, {text: "Send help!!!!!"});
          break;
        default:
          	sendMessage(senderId, {text: "Default message here."});
      }
    } else if (message.attachments) {
      sendMessage(senderId, {text: "Sorry, I don't understand your request."});
    }
  }
}

var COMMANDS = ["goal", "history", "tip", "help"];
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
