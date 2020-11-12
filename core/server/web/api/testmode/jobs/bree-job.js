// const { parentPort } = require('worker_threads');

const util = require('util');
const logging = require('../../../../../shared/logging');

const setTimeoutPromise = util.promisify(setTimeout);

(async () => {
    // wait for a promise to finish in 5 seconds
    await setTimeoutPromise(5 * 1000);
    logging.info('Hello form bree job!');

    // signal to parent that the job is done
    // if (parentPort) parentPort.postMessage('done');
    // else
    process.exit(0);
})();
