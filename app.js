var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

//changed here
var user_set_goal = false;
var get_tip = false;
var goalsAndCost = {};
var tips = ["tip1", "tip2", "tip3", "tip4", "tip5"];
//end changes

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
    mainGoal();
    break;
  }
  if(get_tip){
    get_tip = false;
    getTip();
    break;
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

function getTip(){
  sendMessage(senderId, {text: tips[Math.floor(Math.random()*tips.length)]});
}

function mainGoal(){
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
        case "tips":
          get_tip = true;
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

var COMMANDS = ["goal", "history", "tips", "help"];
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
