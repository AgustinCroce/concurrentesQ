"use strict";

require('dotenv').config();
const request = require('request'),
  net = require('net'),
  client = new net.Socket(),
  cola = "colita",
  queueCreation = {
    queueName: cola, 
    queueType: "pubsub", 
    queueSize: 100
  };

request.post(`http://${process.env.BROKER_HOST}:${process.env.API_PORT}/queues`, {json:queueCreation}, startClient);

function startClient(error, response) {
  if (error || response.statusCode !== 200) {
    console.log("An error happened when creating the queue");
    return process.exit(1);
  }
  
  client.on("data", function (buffer) {
    const message = JSON.parse(buffer.toString());

    if (message.type === "modeRequest") {
      client.write(JSON.stringify({
        type: "mode",
        mode: "publisher",
        queue: cola
      }));
    }

    if (message.type === "handshakeSuccess") {
      client.removeAllListeners("data");
      spam();
    }

    if (message.type === "handshakeError") {
      console.log("handshake error");
    }

    if (message.type === "queueMaximumSizeReached") {
      console.log("Queue full");
    }
  });
  
  client.connect(process.env.BROKER_PORT, process.env.BROKER_HOST);

  client.on('close', function() {
	  console.log('Connection closed');
  });
}

let i = 0;
function spam() {
    setInterval(() => {
        const spamMessage = {
            type: "publish",
            message: `mensajito ${i++}`
        };

        console.log(spamMessage);

        client.write(JSON.stringify(spamMessage))
    }, 2000);
}