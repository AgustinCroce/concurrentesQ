"use strict";

const Queue = require("./queue");

class PubSubQueue extends Queue {
  constructor() {
    super();
  }

  processNextMessageImplementation() {
    const message = this.messages[0];
    
    this.consumers.forEach((socket) => {
      socket.write(JSON.stringify({message}));
    });
    
    this.messages = this.messages.slice(1, this.messages.length);
  }
}

module.exports = PubSubQueue;