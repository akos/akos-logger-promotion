
'use strict';

const _ = require('lodash');
const chalk = require('chalk');
const moment = require('moment');
const uuid = require('uuid');
const MAX_INSPECT_BODY_LENGTH = 500;

module.exports = (options = {}) => async function requestLogger(ctx, next) {
    let files = null;
    let fields = null;
    const cookie = ctx.get('Cookie');
    const start = moment();
    const requestId = ctx.requestId || uuid.v4();
    let msg = `enter:${ctx.ip}requestId_${requestId}-${chalk.magenta(ctx.method)} "${ctx.path}" from ${ctx.ip}`;
    if (cookie && options.cookie)
        msg += ` with cookie "${cookie}"`;

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
    console.info(msg);
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
        console.error(this, start, null, err);
        throw err;
    }
    if (ctx.errors && ctx.errors.length)
        console.warn(`Request validation errros: ${ctx.errors}`);
    if(ctx.type === 'application/json')
        console.info(`leave: ${ctx.ip} requestId_ ${requestId}-${ctx.method} ${ctx.path} complete ${chalk.bold.white.bgMagenta(ctx.status)} at ${chalk.bold.cyan(moment() - start)}ms with body ${body}`);
    else
        console.info(`leave res: ${ctx.ip} requestId_${requestId}-${ctx.method} ${ctx.path} complete ${chalk.bold.white.bgMagenta(ctx.status)} at ${chalk.bold.cyan(moment() - start)}ms`);
};
