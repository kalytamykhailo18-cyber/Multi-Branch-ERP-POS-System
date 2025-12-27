const errorHandler = require('./errorHandler');
const auth = require('./auth');
const validate = require('./validate');

module.exports = {
  ...errorHandler,
  ...auth,
  ...validate
};
