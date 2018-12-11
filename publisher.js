"use strict";

require("dotenv").config();
const QueueClient = require("./queue-client"),
  client = new QueueClient(process.env.BASE_HOST, process.env.NUMBER_OF_SHARDS, process.env.REPLICAS_NUMBER);

client.connect(process.env.QUEUE_NAME, "publisher")
  .then((s) => {
    console.log("Connected to the broker");
    spam();
  })
  .catch((error) => console.log(error));

let i = 0;
function spam() {
  setInterval(() => {
    const spamMessage = {
      type: "publish",
      message: `mensajito ${i++} en ${process.env.QUEUE_NAME}`
    };

    client.publish(spamMessage)
  }, 350);
}