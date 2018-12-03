"use strict";

class Queue {
  constructor() {
    this.consumers = [];
    this.messages = [];
  }

  addConsumer(socket) {
    this.consumers.push(socket);
  }

  addPublisher(socket) {
    socket.on("data", this.handlePublish.bind(this));
  }

  handlePublish(buffer) { 
    const message = JSON.parse(buffer.toString());
    this.messages.push(message.message)
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
}

module.exports = Queue;
