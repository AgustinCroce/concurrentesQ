"use strict";

const instanceSolver = require("../instance-solver"),
  axios = require("axios");

module.exports = {
  createQueue(req, res) {
    if (!req.body.name || !req.body.type || !req.body.size) {
      return res.status(400).json({
        code: "MISSING_PARAMETERS",
        message: "name, type or size missing"
      });
    }

    const instance = instanceSolver(req.body.name);

    axios.post(`http://${instance}:${process.env.API_PORT}/queues`, req.body)
      .then((response) => {
        res.status(200).json(response.data);
      })
      .catch((error) => {
        return res.status(500).json({
          code: "SERVER_ERROR",
          message: error.message
        })
      });
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
