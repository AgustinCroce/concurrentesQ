"use strict";

require('dotenv').config();
const net = require('net'),
  QueuesRegistry = require("./queues-registry"),
  queueRegistry = new QueuesRegistry(),
  server = net.createServer(queueRegistry.handleConnections.bind(queueRegistry));

setInterval(queueRegistry.processQueues.bind(queueRegistry), process.env.PROCESS_QUEUE_TIME)

server.listen(process.env.BROKER_PORT, process.env.BROKER_HOST);
console.log("Broker up");

