"use strict";

class Queue {
  constructor(queueSize, messages = []) {
    this.consumers = [];
    this.publishers = [];
    this.messages = messages;
    this.queueSize = queueSize;
  }

  addConsumer(socket) {
    this.consumers.push(socket);
    socket.on("close", () => this.removeConsumer(socket))
  }

  removeConsumer(socket) {
    const index = this.consumers.indexOf(socket);
    this.consumers.splice(index, 1);
    socket.end();
  }

  removePublisher(socket) {
    const index = this.publishers.indexOf(socket);
    this.publishers.splice(index, 1);
    socket.end();
  }

  addPublisher(socket) {
    this.publishers.push(socket);
    socket.on("data", (buffer) => this.handlePublish(socket, buffer));
    socket.on("close", () => this.removePublisher(socket))
  }

  handlePublish(socket, buffer) { 
    if (this.messages.length < this.queueSize) {
      const message = JSON.parse(buffer.toString());
      this.messages.push(message.message);
    } else {
      socket.write(JSON.stringify({type: "queueMaximumSizeReached"}));
    }
  }

  hasMessages() {
    return this.messages.length > 0;
  }

  hasConsumers() {
    return this.consumers.length > 0;
  }

  processNextMessage() {
    if (this.hasMessages() && this.hasConsumers()) {
      this.processNextMessageImplementation();
    }
  }

  close() {
    this.consumers.forEach((consumer) => this.removeConsumer(consumer));
    this.publishers.forEach((publisher) => this.removePublisher(publisher));
  }
}

module.exports = Queue;
