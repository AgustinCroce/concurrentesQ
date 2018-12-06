"use strict";

module.exports = function getHandlers(queuesRegistry) {
  return {
    createQueue(req, res) {
      if (!req.body.queueName || !req.body.queueType || !req.body.queueSize) {
        return res.status(400).json({
          code: "MISSING_PARAMETERS",
          message: "queueName, queueType or queueSize"
        });
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
    }
  }
};
