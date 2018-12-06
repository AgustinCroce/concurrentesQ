"use strict";

require('dotenv').config();
const net = require('net'),
    client = new net.Socket();

client.on("data", function (buffer) {
    const message = JSON.parse(buffer.toString());

    if (message.type === "modeRequest") {
        client.write(JSON.stringify({
            type: "mode",
            mode: "consumer",
            queue: "colita"
        }));
    }

    if (message.type === "handshakeSuccess") {
        client.removeAllListeners("data");
        client.on("data", handleMessage);
    }

    if (message.type === "handshakeError") {
        console.log("handshake error");
    }
});

function handleMessage(buffer) {
    console.log(JSON.parse(buffer.toString()));
}

client.connect(process.env.BROKER_PORT, process.env.BROKER_HOST);

client.on('close', function() {
	console.log('Connection closed');
});