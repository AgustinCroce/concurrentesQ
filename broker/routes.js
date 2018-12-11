"use strict";

const instanceSolver = require("../instance-solver")

function isInstance(name, host) {
  return `${instanceSolver(name)}-${process.env.REPLICA_NUMBER}` != host;
}

module.exports = function getHandlers(queuesRegistry) {
  return {
    createQueue(req, res) {
      if (!queuesRegistry.isLeader()) {
        return res.status(401).json({
          code: "NOT_LEADER",
          message: "This instance is not the leader"
        });
      }

      if (!req.body.name || !req.body.type || !req.body.size) {
        return res.status(400).json({
          code: "MISSING_PARAMETERS",
          message: "name, type or size missing"
        });
      }

      if (isInstance(req.body.name, process.env.BROKER_HOST)) {
        return res.status(400).json({
          code: "INVALID_INSTANCE",
          message: `This queue should go against ${instanceSolver(req.body.name)}, this is ${process.env.BROKER_HOST}`
        });
      }

      queuesRegistry.addQueue(req.body.name, req.body.type, req.body.size)
        .then((queue) => {
          return res.status(200).json(queue);
        })
        .catch((error) => {
          return res.status(500).json({
            code: "SERVER_ERROR",
            message: error.message
          })
        });
    },
    removeQueue(req, res) {
      if (!queuesRegistry.isLeader()) {
        return res.status(401).json({
          code: "NOT_LEADER",
          message: "This instance is not the leader"
        });
      }

      if (isInstance(req.params.queueName, process.env.BROKER_HOST)) {
        return res.status(400).json({
          code: "INVALID_INSTANCE",
          message: `This queue should go against ${instanceSolver(req.params.queueName)}, this is ${process.env.BROKER_HOST}`
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
    },
    getQueueData(req, res) {
      if (!queuesRegistry.isLeader()) {
        return res.status(401).json({
          code: "NOT_LEADER",
          message: "This instance is not the leader"
        });
      }

      if (isInstance(req.params.queueName, process.env.BROKER_HOST)) {
        return res.status(400).json({
          code: "INVALID_INSTANCE",
          message: `This queue should go against ${instanceSolver(req.params.queueName)}, this is ${process.env.BROKER_HOST}`
        });
      }

      queuesRegistry.getQueueData(req.params.queueName)
        .then((queueData) => {
          return res.status(200).json(queueData);
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
  }
};
