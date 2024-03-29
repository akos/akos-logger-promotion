
'use strict';

const _ = require('lodash');
const chalk = require('chalk');
const moment = require('moment');
const uuid = require('uuid');
const MAX_INSPECT_BODY_LENGTH = 500;

module.exports = (options = {}) => async function requestLogger(ctx, next) {
    let files = null;
    let fields = null;
    const start = moment();
    const requestId = ctx.reqId || uuid.v4();
    const log = ctx.app.logger || console.log;
    let msg = `enter:${ctx.ip}requestId_${requestId}-${chalk.magenta(ctx.method)} "${ctx.path}" from ${ctx.ip}`;

    if (ctx.query && !_.isEmpty(ctx.query))
        msg += ` with querystring ${JSON.stringify(ctx.query)}`;

    if (ctx.request.fields || ctx.request.files) {
        files = JSON.stringify(ctx.request.files);
        fields = JSON.stringify(ctx.request.fields);
        if (fields && !_.isEmpty(fields))
            msg += ` with form params ${fields}`;

        if (files && !_.isEmpty(files))
            msg += ` with files ${files}`;
    }
    log.info(`[akos-logger-promotion] %s`, msg);
    await next();
    let body;
    try {
        if (_.isString(ctx.body) || _.isBuffer(ctx.body)) {
            body = ctx.body.toString();
            if (body.length > MAX_INSPECT_BODY_LENGTH)
                body = body.slice(0, MAX_INSPECT_BODY_LENGTH) + '...';
        } else if (ctx.body && ctx.body.readable)
            body = `from file "${ctx.body.path}"`;
        else
            body = JSON.stringify(ctx.body) || 'Not Found';
    } catch (err) {
        // log uncaught downstream errors
        log.error(this, start, null, err);
        throw err;
    }
    if (ctx.errors && ctx.errors.length)
        log.warn('[akos-logger-promotion] %s', `Request validation errros: ${ctx.errors}`);
    if (ctx.type === 'application/json')
        log.info('[akos-logger-promotion] %s', `leave: ${ctx.ip} requestId_${requestId}-${ctx.method} ${ctx.path} complete ${chalk.bold.white.bgMagenta(ctx.status)} at ${chalk.bold.cyan(moment() - start)}ms with body ${body}`);
    else
        log.info('[akos-logger-promotion] %s', `leave res: ${ctx.ip} requestId_${requestId}-${ctx.method} ${ctx.path} complete ${chalk.bold.white.bgMagenta(ctx.status)} at ${chalk.bold.cyan(moment() - start)}ms`);
};
