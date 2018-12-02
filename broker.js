"use strict";

require('dotenv').config();
const net = require('net'),
    queues = {},
    modeMessage = JSON.stringify({type: "modeRequest"}),
    server = net.createServer(handleSocket);

function handleSocket(socket) {
    socket.on("data", (buffer) => handleHandshake(socket, buffer));
    socket.write(modeMessage)
}

function handleModeMessage(socket, message) {
    switch (message.mode) {
        case "publisher":
            socket.removeAllListeners("data");
            addPublisher(message.queue, socket)
            socket.write(JSON.stringify({type: "handshakeSuccess"}));
        break;
        case "consumer":
            socket.removeAllListeners("data");
            addConsumer(message.queue, socket);
            socket.write(JSON.stringify({type: "handshakeSuccess"}));
        break;
        default:
            socket.destroy(new Error(`Unkown mode ${message.mode}`));
        break;
    }
}

function addConsumer(queue, socket) {
    if (!queues[queue]) {
        queues[queue] = {
            consumers: [],
            consumerCursor: 0,
            messages: []
        };
    }

    queues[queue].consumers = queues[queue].consumers.concat([socket]); 
}

function addPublisher(queue, socket) {
    socket.on("data", (buffer) => handlePublish(queue, buffer));
}

function handlePublish(queue, buffer) {
    if (!queues[queue]) {
        queues[queue] = {
            consumers: [],
            consumerCursor: 0,
            messages: []
        };
    }

    const message = JSON.parse(buffer.toString());
    queues[queue].messages.push(message.message)
}

function handleHandshake(socket, buffer) {
    const message = JSON.parse(buffer.toString());
    switch (message.type) {
        case "mode":
            handleModeMessage(socket, message);
        break;
        default:
            socket.destroy(new Error(`Unexpected message type ${message.type}`));
        break;
    }
}

function handleQueues() {
    Object.keys(queues)
        .forEach((queueName) => handleQueue(queues[queueName]));
}

function hasMessages(queue) {
    return queue.messages.length > 0;
}

function hasConsumers(queue) {
    return queue.consumers.length > 0;
}

function handleQueue(queue) {
    if (hasMessages(queue) && hasConsumers(queue)) {
        const socket = queue.consumers[queue.consumerCursor],
            message = queue.messages[1];
        
        socket.write(JSON.stringify({message}));
        queue.messages = queue.messages.slice(1, queue.messages.length);
        queue.consumerCursor = (queue.consumerCursor + 1) % queue.consumers.length;
    }
}

setInterval(handleQueues, 5000)

server.listen(process.env.BROKER_PORT, process.env.BROKER_HOST);
console.log("Broker up");
