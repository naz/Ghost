const path = require('path');
const _ = require('lodash');
const uuid = require('uuid');
const os = require('os');
const should = require('should');
const supertest = require('supertest');
const config = require('../../../../../../core/server/config');
const testUtils = require('../../../../utils');
const localUtils = require('./utils');

const ghost = testUtils.startGhost;

describe.only('Authentication', function () {
    let request;
    let scope = {
        ownerAccessToken: '',
        editorAccessToken: '',
        uploadTheme: function uploadTheme(options) {
            const themePath = options.themePath;
            const fieldName = options.fieldName || 'theme';
            const accessToken = options.accessToken || scope.ownerAccessToken;

            return request.post(localUtils.API.getApiQuery('themes/upload'))
                .set('Origin', config.get('url'))
                .attach(fieldName, themePath);
        },
        editor: null
    }, ghostServer, contentFolder = path.join(os.tmpdir(), uuid.v1(), 'ghost-test');

    before(function () {
        return ghost()
            .then(function (_ghostServer) {
                ghostServer = _ghostServer;
                request = supertest.agent(config.get('url'));
            })
            .then(() => {
                return localUtils.doAuth(request);
            })
            .then(function (token) {
                scope.ownerAccessToken = token;

                return testUtils.createUser({
                    user: testUtils.DataGenerator.forKnex.createUser({email: 'test+1@ghost.org'}),
                    role: testUtils.DataGenerator.Content.roles[1].name
                });
            })
            .then(function (user) {
                scope.editor = user;

                request.user = scope.editor;
                return localUtils.doAuth(request);
            })
            .then(function (token) {
                scope.editorAccessToken = token;

                return testUtils.createUser({
                    user: testUtils.DataGenerator.forKnex.createUser({email: 'test+author@ghost.org'}),
                    role: testUtils.DataGenerator.Content.roles[2].name
                });
            })
            .then(function (user) {
                scope.author = user;

                request.user = scope.author;
                return localUtils.doAuth(request);
            })
            .then(function (token) {
                scope.authorAccessToken = token;
            });
    });

    it('get here', () => {
        should(1).equal(1);
    });
});
