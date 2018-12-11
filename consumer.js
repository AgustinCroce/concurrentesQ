"use strict";

require("dotenv").config();
const QueueClient = require("./queue-client"),
  client = new QueueClient(process.env.BASE_HOST, process.env.SHARDS_NUMBER, process.env.REPLICAS_NUMBER);

client.onMessage = function handleMessage(message) {
  console.log(message);
}

client.connect(process.env.QUEUE_NAME, "consumer")
  .then(() => console.log("Connected to the broker"))
  .catch((error) => console.log(error));