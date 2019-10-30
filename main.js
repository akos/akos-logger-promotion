const requestIdLogger = require('./lib/requestLogger');
const bunyanLogger = require('./lib/bunyanLogger');
module.exports = function (app, options = {}) {
    let name = options.name || 'akos-logger';
    app.use(bunyanLogger({
        name,
    }));
    app.use(bunyanLogger.requestIdContext());
    app.use(requestIdLogger(options))
}