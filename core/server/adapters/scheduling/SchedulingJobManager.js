const util = require('util');
const path = require('path');
const moment = require('moment');
const debug = require('ghost-ignition').debug('scheduling-job-manager');
const SchedulingBase = require('./SchedulingBase');
const jobsService = require('../../services/jobs');

/**
 *
 * @param {Object} object
 * @param {Number} object.time - unix timestamp
 * @param {String} object.url - scheduling endpoint URL
 */
const getJobName = (object) => {
    return `${object.time}-${object.url}`;
};

/**
 * @description post/page scheduling implementation using job manager
 *
 * @param {Object} options
 * @constructor
 */
function SchedulingJobManager(options) {
    SchedulingBase.call(this, options);

    // NOTE: An offset between now and past, which helps us choosing jobs which need to be executed soon.
    this.offsetInMinutes = 10;

    // NOTE: Each scheduler implementation can decide whether to load scheduled posts on bootstrap or not.
    this.rescheduleOnBoot = true;
}

util.inherits(SchedulingJobManager, SchedulingBase);

/**
 * @description Add a new job to the scheduler.
 *
 * A new job get's added when the post scheduler module receives a new model event e.g. "post.scheduled".
 *
 * @param {Object} object
 * @param {Number} object.time - unix timestamp
 * @param {String} object.url - full post/page API url to publish the resource.
 * @param {Object} object.extra
 * @param {String} object.extra.httpMethod - the method of the target API endpoint.
 * @param {Number} object.extra.oldTime - the previous published time.
 */
SchedulingJobManager.prototype.schedule = function (object) {
    const name = getJobName(object);

    // CASE: should have been already pinged or should be pinged soon
    if (moment(object.time).diff(moment(), 'minutes') < this.offsetInMinutes) {
        debug('Emergency job', object.url, moment(object.time).format('YYYY-MM-DD HH:mm:ss'));

        jobsService.addJob({
            job: require('./jobs/ping-url'),
            data: object
        });
    } else {
        const at = moment(object.time).toDate();

        jobsService.addJob({
            at,
            job: path.resolve(__dirname, './jobs/ping-url.js'),
            data: object,
            name
        });
    }

    debug('Added job', name, moment(object.time).format('YYYY-MM-DD HH:mm:ss'));
};

/**
 * @description Unschedule a job.
 *
 * Unscheduling means: scheduled -> draft.
 *
 * @param {Object} object
 * @param {Number} object.time - unix timestamp
 * @param {String} object.url - full post/page API url to publish the resource.
 * @param {Object} object.extra
 * @param {String} object.extra.httpMethod - the method of the target API endpoint.
 * @param {Number} object.extra.oldTime - the previous published time.
 * @param {Object} options
 * @param {Boolean} [options.bootstrap]
 */
SchedulingJobManager.prototype.unschedule = function (object, options = {bootstrap: false}) {
    /**
     * CASE:
     * The post scheduling unit triggers "reschedule" on bootstrap, because other custom scheduling implementations
     * could use a database and we need to give the chance to update the job (delete + re-add).
     *
     * We receive a "bootstrap" variable to ensure that jobs are scheduled correctly for this scheduler implementation,
     * because "object.extra.oldTime" === "object.time". If we mark the job as deleted, it won't get scheduled.
     */
    if (!options.bootstrap) {
        this._deleteJob(object);
    }
};

SchedulingJobManager.prototype.run = function () {
    // nothing to do here
};

SchedulingJobManager.prototype._deleteJob = function ({url, time}) {
    const deleteKey = getJobName({url, time});

    debug('Deleted job', url, moment(time).format('YYYY-MM-DD HH:mm:ss'));
    jobsService.removeJob(deleteKey);
};

module.exports = SchedulingJobManager;
