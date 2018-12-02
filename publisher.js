"use strict";

require('dotenv').config();
const net = require('net'),
    client = new net.Socket();

client.on("data", function (buffer) {
    const message = JSON.parse(buffer.toString());

    if (message.type === "modeRequest") {
        client.write(JSON.stringify({
            type: "mode",
            mode: "publisher",
            queue: "colita"
        }));
    }

    if (message.type === "handshakeSuccess") {
        client.removeAllListeners("data");
        spam();
    }
});

let i = 0;
function spam() {
    setInterval(() => {
        const spamMessage = {
            type: "publish",
            message: `mensajito ${i++}`
        };

        client.write(JSON.stringify(spamMessage))
    }, 2000);
}

client.connect(process.env.BROKER_PORT, process.env.BROKER_HOST);

client.on('close', function() {
	console.log('Connection closed');
});