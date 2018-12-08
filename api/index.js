"use strict";

require("dotenv").config();
const express = require("express"),
  bodyParser = require("body-parser"),
  app = express(),
  routes = require("./routes"),
  apiPort = process.env.API_PORT || 3000;

app.use(bodyParser.json());

app.get("/health", routes.healthCheck);
app.post("/queues", routes.createQueue);
app.get("/queues/:queueName", routes.getQueueData);
app.delete("/queues/:queueName", routes.removeQueue);

app.listen(apiPort, function () {
  console.log(`API running on ${apiPort} !`);
});
