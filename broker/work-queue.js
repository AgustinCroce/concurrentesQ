"use strict";

const Queue = require("./queue");

class WorkQueue extends Queue {
  constructor() {
    super();
    this.consumerCursor = 0;
  }

  processNextMessageImplementation() {
    const socket = this.consumers[this.consumerCursor],
      message = this.messages[0];
        
    socket.write(JSON.stringify({message}));
    this.messages = this.messages.slice(1, this.messages.length);
    this.consumerCursor = (this.consumerCursor + 1) % this.consumers.length;
  }
}

module.exports = WorkQueue;