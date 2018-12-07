"use strict";

const instanceSolver = require("../instance-solver")

module.exports = function getHandlers(queuesRegistry) {
  return {
    createQueue(req, res) {
      if (!req.body.queueName || !req.body.queueType || !req.body.queueSize) {
        return res.status(400).json({
          code: "MISSING_PARAMETERS",
          message: "queueName, queueType or queueSize missing"
        });
      }

      if(instanceSolver(req.body.queueName)!=process.env.BROKER_HOST){
        return res.status(400).json({
          code: "INVALID_INSTANCE",
          message: `This queue should go against ${instanceSolver(req.body.queueName)}, this is ${process.env.BROKER_HOST}`
        })
      }

      queuesRegistry.addQueue(req.body.queueName, req.body.queueType, req.body.queueSize)
        .then(() => {
          return res.status(200).send();
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

      queuesRegistry.removeQueue(req.params.queueName)
        .then(() => {
          return res.status(200).send();
        })
        .catch((error) => {
          return res.status(500).json({
            code: "SERVER_ERROR",
            message: error.message
          })
        });
    }
  }
};
