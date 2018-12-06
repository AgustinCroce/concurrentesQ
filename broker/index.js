"use strict";

require('dotenv').config();
const net = require('net'),
  QueuesRegistry = require("./queues-registry"),
  queueRegistry = new QueuesRegistry(),
  server = net.createServer(queueRegistry.handleConnections.bind(queueRegistry));

setInterval(queueRegistry.processQueues.bind(queueRegistry), process.env.PROCESS_QUEUE_TIME)

console.log(process.env.BROKER_HOST);

server.listen(process.env.BROKER_PORT, process.env.BROKER_HOST);
console.log("Broker up");

const express = require('express');

const app = express();

app.set('port', process.env.HEALTH_PORT || 3000);

app.get("/health", (req, res, next) => res.send({status: 'UP'}));

const health_port = process.env.HEALTH_PORT || 3000;

app.listen(health_port, function () {
  console.log(`Health check running on ${health_port} !`);
});

