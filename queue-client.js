"use strict";

const instanceSolver = require("./instance-solver"),
  net = require("net");

class QueueClient {
  constructor(baseHost, shardsNumber, replicasNumber) {
    this.baseHost = baseHost;
    this.shardsNumber = shardsNumber;
    this.replicasNumber = replicasNumber;
  }

  connect(queueName, mode) {
    console.log("connecting");
    const range = this.getRange(this.replicasNumber),
      connectionPromises = range.map((number) => this.tryConnect(queueName, mode, number));
    
    return Promise.race(connectionPromises.concat(this.timeoutReject()));
  }

  timeoutReject() {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error("Connection timeout")), 15000);
    });
  }

  tryConnect(queueName, mode, replicaNumber) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket(),
        broker = `${instanceSolver(queueName)}-${replicaNumber}`;

      client.on("data", (buffer) => {
        const message = JSON.parse(buffer.toString());
      
        if (message.type === "modeRequest") {
          client.write(JSON.stringify({
            type: "mode",
            mode: mode,
            queue: queueName
          }));
        }
      
        if (message.type === "handshakeSuccess") {
          client.removeAllListeners("data");
          client.removeAllListeners("close");

          client.on("close", () => {
            this.client = null;
            setTimeout(() => this.connect(queueName, mode), 3000);
          });

          if (mode === "consumer") {
            client.on("data", (buffer) => {
              if (this.onMessage) {
                this.onMessage(JSON.parse(buffer.toString()));
              }
            });  
          }

          if (mode === "publisher") {
            this.client = client;
          }

          resolve(this);
        }
      
        if (message.type === "handshakeError") {
          console.log("handshake error");
        }
      });
      
      client.connect(process.env.BROKER_PORT, broker);
      
      client.on('close', function() {
        console.log(`${broker} closed connection`);
      });

      client.on("error", console.log);
    });
  }

  getRange(range) {
    const array = [];
    
    for(let i = 1; i <= range; i++) {
      array.push(i);
    }

    return array;
  }

  publish(message) {
    if (this.client) {
      this.client.write(JSON.stringify(message));
      console.log(message);
    }
  }
}

module.exports = QueueClient;