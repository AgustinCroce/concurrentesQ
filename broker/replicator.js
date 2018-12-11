"use strict";

const Democracy = require("democracy");

class Replicator {
  constructor(queueRegistry) {
    this.queueRegistry = queueRegistry;
    this.democracyClient = new Democracy({
      source: `${process.env.BROKER_HOST}:${process.env.REPLICATOR_PORT}`,
      peers: JSON.parse(process.env.PEERS),
      channels: ["queueUpdate"],
      interval: 250,
      timeout: 1000
    });

    this.democracyClient.on('elected', () => {
      console.log('I am the new leader');
      this.startReplication();
    });

    this.democracyClient.on('queueUpdate', (queueData) => {
      this.queueRegistry.updateQueue(queueData);
    });
  }

  isLeader() {
    return this.democracyClient.isLeader();
  }

  startReplication() {
    setInterval(() => {
      this.queueRegistry
        .getQueuesData()
        .then((queuesData) => this.cleanQueueData(queuesData))
        .then((cleanedQueuesData) => this.sendQueuesUpdate(cleanedQueuesData));
    }, process.env.REPLICATOR_TIME);
  }

  cleanQueueData(queuesData) {
    queuesData.forEach((queueData) => {
      Reflect.deleteProperty(queueData, "publishersConnected");
      Reflect.deleteProperty(queueData, "consumersConnected");
      Reflect.deleteProperty(queueData, "broker");
    });
    return queuesData;
  }

  sendQueuesUpdate(queuesData) {
    queuesData.forEach((queueData) => this.sendQueueUpdate(queueData));
  }

  sendQueueUpdate(queueData) {
    if (this.isLeader()) {
      this.democracyClient.publish("queueUpdate", queueData);
    }
  }
}

module.exports = Replicator;
