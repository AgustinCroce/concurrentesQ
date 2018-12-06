"use strict";

const cola = "colita";

const queueCreation = {queueName:cola,queueType:"pubsub",queueSize:100}
var request = require('request');
request.post(`http://${process.env.BROKER_HOST}:3000/queues`, {json:queueCreation}, (error, response, body) => {
    console.log(response.statusCode);
});

require('dotenv').config();
const net = require('net'),
    client = new net.Socket();

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

client.connect(process.env.BROKER_PORT, process.env.BROKER_HOST);

client.on('close', function() {
	console.log('Connection closed');
});