const Promise = require('bluebird');
const common = require('../../lib/common');
const models = require('../../models');
const auth = require('../../services/auth');

const session = {
    read(frame) {
        /*
         * TODO
         * Don't query db for user, when new api http wrapper is in we can
         * have direct access to req.user, we can also get access to some session
         * inofrmation too and send it back
         */
        return models.User.findOne({id: frame.options.context.user});
    },
    add(frame) {
        const object = frame.data;

        if (!object || !object.username || !object.password) {
            return Promise.reject(new common.errors.UnauthorizedError({
                message: common.i18n.t('errors.middleware.auth.accessDenied')
            }));
        }

        return models.User.check({
            email: object.username,
            password: object.password
        }).then((user) => {
            return Promise.resolve((req, res, next) => {
                req.brute.reset(function (err) {
                    if (err) {
                        return next(err);
                    }
                    req.user = user;
                    auth.session.createSession(req, res, next);
                });
            });
        }).catch(async (err) => {
            if (!common.errors.utils.isIgnitionError(err)) {
                throw new common.errors.UnauthorizedError({
                    message: common.i18n.t('errors.middleware.auth.accessDenied'),
                    err
                });
            }

            if (err.errorType === 'NoPermissionError') {
                let options = {
                    filter: `resource_id:${err.context.user_id}`,
                    limit: 1
                };

                const action = await models.Action.findPage(options);

                if (action.data && action.data[0].get('event') === 'security') {
                    // this means the last action stored for the user was "locked" for security reason
                    // we replace context on current error with whatever is stored in the action context
                    const linkToSomeMoreInfo = action.data[0].get('context');
                    err.context = `You have to reset password, blah blah heree's more info: ${linkToSomeMoreInfo}`;
                }
            }

            throw err;
        });
    },
    delete() {
        return Promise.resolve((req, res, next) => {
            auth.session.destroySession(req, res, next);
        });
    }
};

module.exports = session;
