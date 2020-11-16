// const { parentPort } = require('worker_threads');

const util = require('util');
const logging = require('../../../../../shared/logging');
const models = require('../../../../models');

const setTimeoutPromise = util.promisify(setTimeout);
const internalContext = {context: {internal: true}};

(async () => {
    try {
        await models.init();
        const tags = await models.Tag.findPage(internalContext);

        logging.info(`Found ${tags.data.length} tags. First one: ${tags.data[0].toJSON().slug}`);

        // 5 seconds delay
        await setTimeoutPromise(5 * 1000);

        logging.info('Bree job has completed!');
        process.exit(0);
    } catch (err) {
        logging.error(err);
        process.exit(1);
    }
})();
