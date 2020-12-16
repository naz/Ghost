const {isMainThread, parentPort, workerData} = require('bthreads');
const moment = require('moment');
const errors = require('@tryghost/errors');
const debug = require('ghost-ignition').debug('scheduling-job-manager');
const logging = require('../../../../shared/logging');
const request = require('../../../lib/request');

const retryTimeoutInMs = 1000 * 5;

/**
 * @description Ping the job URL.
 * @param {Object} object
 * @return {Promise | any}
 */
const pingUrl = function (object, done) {
    const {url, time} = object;

    debug('Ping url', url, moment().format('YYYY-MM-DD HH:mm:ss'), moment(time).format('YYYY-MM-DD HH:mm:ss'));

    const httpMethod = object.extra ? object.extra.httpMethod : 'PUT';
    const tries = object.tries || 0;
    const requestTimeout = (object.extra && object.extra.timeoutInMS) ? object.extra.timeoutInMS : 1000 * 5;
    const maxTries = 30;

    const options = {
        timeout: requestTimeout,
        method: httpMethod.toLowerCase(),
        headers: {
            'Content-Type': 'application/json'
        }
    };

    // CASE: If we detect to publish a post in the past (case blog is down), we add a force flag
    if (moment(time).isBefore(moment())) {
        if (httpMethod === 'GET') {
            // @TODO: rename to searchParams when updating to Got v10
            options.query = 'force=true';
        } else {
            options.body = JSON.stringify({force: true});
        }
    }

    return request(url, options)
        .then(() => {
            if (done) {
                done();
            }
        })
        .catch((err) => {
            const {statusCode} = err;

            // CASE: post/page was deleted already
            if (statusCode === 404) {
                return;
            }

            // CASE: blog is in maintenance mode, retry
            if (statusCode === 503 && tries < maxTries) {
                setTimeout(() => {
                    object.tries = tries + 1;
                    this._pingUrl(object, done);
                }, retryTimeoutInMs);

                logging.error(new errors.GhostError({
                    err,
                    context: 'Retrying...',
                    level: 'normal'
                }));

                return;
            }

            logging.error(new errors.GhostError({
                err,
                level: 'critical'
            }));
        });
};

if (isMainThread) {
    module.exports = pingUrl;
} else {
    (async () => {
        pingUrl(workerData, () => {
            parentPort.postMessage('done');
        });
    })();
}
