"use strict";

const instanceSolver = require("../instance-solver"),
  axios = require("axios"),
  leaders = {};

function getInstanceNumber(instance) {
  if (!leaders.hasOwnProperty(instance)) {
    leaders[instance] = 1;
  } else {
    leaders[instance] = ((leaders[instance]) % parseInt(process.env.REPLICAS_NUMBER)) + 1;
  }

  return leaders[instance];
}

function sendHttpToReplicas(instance, uri, method, body, res) {
  return axios[method](`http://${instance}-${getInstanceNumber(instance)}:${process.env.API_PORT}/${uri}`, body)
    .then((response) => {
      if (response.data) {
        res.status(200).json(response.data);  
      } else {
        res.status(200).send();
      }
    })
    .catch((error) => {
      if (error.response.status === 401) {
        return sendHttpToReplicas(instance, uri, method, body, res)
      }
      return res.status(500).json({
        code: "SERVER_ERROR",
        message: error.message
      });
  });
}

module.exports = {
  createQueue(req, res) {
    if (!req.body.name || !req.body.type || !req.body.size) {
      return res.status(400).json({
        code: "MISSING_PARAMETERS",
        message: "name, type or size missing"
      });
    }

    const instance = instanceSolver(req.body.name);

    sendHttpToReplicas(instance, "queues", "post", req.body, res);
  },
  removeQueue(req, res) {
    if (!req.params.queueName) {
      return res.status(400).json({
        code: "MISSING_PARAMETERS",
        message: "queueName missing"
      });
    }

    const instance = instanceSolver(req.params.queueName);

    sendHttpToReplicas(instance, `queues/${req.params.queueName}`, "delete", null, res);
  },
  getQueueData(req, res) {
    if (!req.params.queueName) {
      return res.status(400).json({
        code: "MISSING_PARAMETERS",
        message: "queueName missing"
      });
    }

    const instance = instanceSolver(req.params.queueName);

    sendHttpToReplicas(instance, `queues/${req.params.queueName}`, "get", null, res);
  },
  healthCheck(req, res) {
    res.status(200).json({status: 'UP'});
  }
};
