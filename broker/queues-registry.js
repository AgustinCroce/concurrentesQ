"use strict";

const WorkQueue = require("./work-queue"),
  PubSubQueue = require("./pubsub-queue"),
  MODE_MESSAGE = {type: "modeRequest"},
  HANDSHAKE_SUCCESS_MESSAGE = {type: "handshakeSuccess"},
  HANDSHAKE_ERROR_MESSAGE = {type: "handshakeError"};

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
      break;
      case "consumer":
        socket.removeAllListeners("data");
        this.addConsumer(message.queue, socket);
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
      socket.write(JSON.stringify(HANDSHAKE_ERROR_MESSAGE));
      return socket.end();
    }

    this.queues[queueName].addPublisher(socket);
    socket.write(JSON.stringify(HANDSHAKE_SUCCESS_MESSAGE));
  }

  addConsumer(queueName, socket) {
    if (!this.queues.hasOwnProperty(queueName)) {
      socket.write(JSON.stringify(HANDSHAKE_ERROR_MESSAGE));
      return socket.end();
    }

    this.queues[queueName].addConsumer(socket);
    socket.write(JSON.stringify(HANDSHAKE_SUCCESS_MESSAGE));
  }

  addQueue(queueName, queueType, queueSize) {
    return new Promise((resolve, reject) => {
      if (queueType === "work") {
        this.addWorkQueue(queueName, queueSize);
        return resolve();
      }
  
      if (queueType === "pubsub") {
        this.addPubSubQueue(queueName, queueSize);
        return resolve();
      }
  
      reject(new Error(`Wrong queue type ${queueType}`));
    });
  }

  removeQueue(queueName) {
    return new Promise((resolve, reject) => {
      if (!this.queues.hasOwnProperty(queueName)) {
        reject(new Error(`Queue not found`));  
      }
      
      this.queues[queueName].close();
      Reflect.deleteProperty(this.queues, queueName);
      resolve();
    });
  }

  addWorkQueue(queueName, queueSize) {
    const workQueue = new WorkQueue(queueSize);
    this.queues[queueName] = workQueue;
  }

  addPubSubQueue(queueName, queueSize) {
    const pubsubQueue = new PubSubQueue(queueSize);
    this.queues[queueName] = pubsubQueue;
  }
}

module.exports = QueuesRegistry;
