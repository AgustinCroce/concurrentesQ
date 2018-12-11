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

    // axios.post(`http://${instance}:${process.env.API_PORT}/queues`, req.body)
    //   .then((response) => {
    //     res.status(200).json(response.data);
    //   })
    //   .catch((error) => {
    //     return res.status(500).json({
    //       code: "SERVER_ERROR",
    //       message: error.message
    //     })
    //   });
  },
  removeQueue(req, res) {
    if (!req.params.queueName) {
      return res.status(400).json({
        code: "MISSING_PARAMETERS",
        message: "queueName missing"
      });
    }

    const instance = instanceSolver(req.params.queueName);

    axios.delete(`http://${instance}:${process.env.API_PORT}/queues/${req.params.queueName}`)
      .then(() => {
        res.status(200).send();
      })
      .catch((error) => {
        return res.status(500).json({
          code: "SERVER_ERROR",
          message: error.message
        })
      });
  },
  getQueueData(req, res) {
    if (!req.params.queueName) {
      return res.status(400).json({
        code: "MISSING_PARAMETERS",
        message: "queueName missing"
      });
    }

    const instance = instanceSolver(req.params.queueName);

    axios.get(`http://${instance}:${process.env.API_PORT}/queues/${req.params.queueName}`)
      .then((response) => {
        res.status(200).send(response.data);
      })
      .catch((error) => {
        return res.status(500).json({
          code: "SERVER_ERROR",
          message: error.message
        })
      });
  },
  healthCheck(req, res) {
    res.status(200).json({status: 'UP'});
  }
};
