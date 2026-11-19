const app = require('../server/dist/server.js');

module.exports = (req, res) => {
  return app(req, res);
};
