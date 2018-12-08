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

  addQueue(name, type, size) {
    const queue = {
      name: name,
      type: type,
      size: size,
      broker: process.env.BROKER_HOST
    };
    
    return new Promise((resolve, reject) => {
      if (type === "work") {
        this.addWorkQueue(name, size);
        return resolve(queue);
      }
  
      if (type === "pubsub") {
        this.addPubSubQueue(name, size);
        return resolve(queue);
      }
  
      reject(new Error(`Wrong queue type ${type}`));
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

  getQueueData(queueName) {
    return new Promise((resolve, reject) => {
      if (!this.queues.hasOwnProperty(queueName)) {
        reject(new Error(`Queue not found`));  
      }
      
      const queue = this.queues[queueName];
      resolve({
        size: queue.queueSize,
        type: queue.queueType,
        publishersConnected: queue.publishers.length,
        consumersConnected: queue.publishers.length,
        name: queueName,
        messages: queue.messages,
        broker: process.env.BROKER_HOST
      });
    });
  }
}

module.exports = QueuesRegistry;
