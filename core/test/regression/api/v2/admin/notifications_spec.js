const should = require('should');
const supertest = require('supertest');
const testUtils = require('../../../../utils');
const config = require('../../../../../server/config');
const localUtils = require('./utils');
const ghost = testUtils.startGhost;

describe('Notifications API', function () {
    describe('As Editor', function () {
        let request;

        before(function () {
            return ghost()
                .then(function (_ghostServer) {
                    request = supertest.agent(config.get('url'));
                })
                .then(function () {
                    return testUtils.createUser({
                        user: testUtils.DataGenerator.forKnex.createUser({
                            email: 'test+editor@ghost.org'
                        }),
                        role: testUtils.DataGenerator.Content.roles[1].name
                    });
                })
                .then((user) => {
                    request.user = user;
                    return localUtils.doAuth(request);
                });
        });

        it('Add notification', function () {
            const newNotification = {
                type: 'info',
                message: 'test notification',
                custom: true,
                id: 'customId'
            };

            return request.post(localUtils.API.getApiQuery('notifications/'))
                .set('Origin', config.get('url'))
                .send({notifications: [newNotification]})
                .expect('Content-Type', /json/)
                .expect('Cache-Control', testUtils.cacheRules.private)
                .expect(201)
                .then((res) => {
                    const jsonResponse = res.body;

                    should.exist(jsonResponse);
                    should.exist(jsonResponse.notifications);
                    should.equal(jsonResponse.notifications.length, 1);
                });
        });

        it('Read notifications', function () {
            return request.get(localUtils.API.getApiQuery('notifications/'))
                .set('Origin', config.get('url'))
                .expect('Content-Type', /json/)
                .expect('Cache-Control', testUtils.cacheRules.private)
                .expect(200)
                .then((res) => {
                    const jsonResponse = res.body;

                    should.exist(jsonResponse);
                    should.exist(jsonResponse.notifications);
                    should.equal(jsonResponse.notifications.length, 1);
                });
        });
    });

    describe('As Author', function () {
        let request;

        before(function () {
            return ghost()
                .then(function (_ghostServer) {
                    request = supertest.agent(config.get('url'));
                })
                .then(function () {
                    return testUtils.createUser({
                        user: testUtils.DataGenerator.forKnex.createUser({
                            email: 'test+author@ghost.org'
                        }),
                        role: testUtils.DataGenerator.Content.roles[2].name
                    });
                })
                .then((user) => {
                    request.user = user;
                    return localUtils.doAuth(request);
                });
        });

        it('Add notification', function () {
            const newNotification = {
                type: 'info',
                message: 'test notification',
                custom: true,
                id: 'customId'
            };

            return request.post(localUtils.API.getApiQuery('notifications/'))
                .set('Origin', config.get('url'))
                .send({notifications: [newNotification]})
                .expect('Content-Type', /json/)
                .expect('Cache-Control', testUtils.cacheRules.private)
                .expect(403);
        });

        it('Read notifications', function () {
            return request.get(localUtils.API.getApiQuery('notifications/'))
                .set('Origin', config.get('url'))
                .expect('Content-Type', /json/)
                .expect('Cache-Control', testUtils.cacheRules.private)
                .expect(403);
        });
    });
});
