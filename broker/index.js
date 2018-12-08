"use strict";

require("dotenv").config();
const net = require("net"),
  express = require("express"),
  bodyParser = require("body-parser"),
  app = express(),
  QueuesRegistry = require("./queues-registry"),
  queueRegistry = new QueuesRegistry(),
  routes = require("./routes")(queueRegistry),
  server = net.createServer(queueRegistry.handleConnections.bind(queueRegistry));

setInterval(queueRegistry.processQueues.bind(queueRegistry), process.env.PROCESS_QUEUE_TIME)

const api_port = process.env.API_PORT || 3000;

app.use(bodyParser.json());
app.post("/queues", routes.createQueue);
app.delete("/queues/:queueName", routes.removeQueue);
app.get("/queues/:queueName", routes.getQueueData);
app.get("/health", routes.healthCheck);
app.listen(api_port, function () {
  console.log(`Health check running on ${api_port} !`);
});

server.listen(process.env.BROKER_PORT, process.env.BROKER_HOST);
console.log("Broker up");
