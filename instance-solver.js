"use strict";

const brokerHostName = "broker";
const brokerSharding = parseInt(process.env.NUMBER_OF_SHARDS);

const higherHash = "ffffffffffffffffffffffffffffffff";
const higherNumber = parseInt(higherHash,16);
const split = higherNumber/brokerSharding;
const crypto = require('crypto');

module.exports = (queueName) => `${brokerHostName}-${Math.floor(parseInt(crypto.createHash('md5').update(queueName).digest("hex"),16)/split)}`