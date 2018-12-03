"use strict";

const WorkQueue = require("./work-queue"),
  PubSubQueue = require("./pubsub-queue"),
  MODE_MESSAGE = {type: "modeRequest"},
  HANDSHAKE_SUCCESS_MESSAGE = {type: "handshakeSuccess"};

class QueuesRegistry {
  constructor() {
    this.queues = {};
  }

  handleConnections(socket) {
    socket.on("data", (buffer) => this.handleHandshake(socket, buffer));
    socket.write(JSON.stringify(MODE_MESSAGE));
  }

  handleHandshake(socket, buffer) {
    const message = JSON.parse(buffer.toString());
    switch (message.type) {
      case "mode":
        this.handleModeMessage(socket, message);
      break;
      default:
        socket.destroy(new Error(`Unexpected message type ${message.type}`));
      break;
    }
  }

  handleModeMessage(socket, message) {
    switch (message.mode) {
      case "publisher":
        socket.removeAllListeners("data");
        this.addPublisher(message.queue, socket)
        socket.write(JSON.stringify(HANDSHAKE_SUCCESS_MESSAGE));
      break;
      case "consumer":
        socket.removeAllListeners("data");
        this.addConsumer(message.queue, socket);
        socket.write(JSON.stringify(HANDSHAKE_SUCCESS_MESSAGE));
      break;
      default:
        socket.destroy(new Error(`Unkown mode ${message.mode}`));
      break;
    }
  }

  processQueues() {
    Object.keys(this.queues)
      .forEach((queueName) => this.queues[queueName].processNextMessage());
  }

  addPublisher(queueName, socket) {
    if (!this.queues.hasOwnProperty(queueName)) {
      // this.addWorkQueue(queueName);
      this.addPubSubQueue(queueName);
    }

    this.queues[queueName].addPublisher(socket);
  }

  addConsumer(queueName, socket) {
    if (!this.queues.hasOwnProperty(queueName)) {
      // this.addWorkQueue(queueName);
      this.addPubSubQueue(queueName);
    }

    this.queues[queueName].addConsumer(socket);
  }

  addWorkQueue(queueName) {
    const workQueue = new WorkQueue();
    this.queues[queueName] = workQueue;
  }

  addPubSubQueue(queueName) {
    const pubsubQueue = new PubSubQueue();
    this.queues[queueName] = pubsubQueue;
  }
}

module.exports = QueuesRegistry;
