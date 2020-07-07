const should = require('should');
const supertest = require('supertest');
const testUtils = require('../../../../utils');
const config = require('../../../../../core/shared/config');
const localUtils = require('./utils');

const ghost = testUtils.startGhost;

describe('Webhooks API', function () {
    let request;

    before(function () {
        return ghost()
            .then(function () {
                request = supertest.agent(config.get('url'));
            })
            .then(function () {
                return testUtils.initFixtures('api_keys');
            });
    });

    it('Can creates a webhook using integration', function () {
        let webhookData = {
            event: 'test.create',
            target_url: 'http://example.com/webhooks/test/extra/1',
            integration_id: 'ignore_me',
            name: 'test',
            secret: 'thisissecret',
            api_version: 'v3'
        };

        return request.post(localUtils.API.getApiQuery('webhooks/'))
            .set('Authorization', `Ghost ${localUtils.getValidAdminToken('/canary/admin/', testUtils.DataGenerator.Content.api_keys[0])}`)
            .send({webhooks: [webhookData]})
            .expect('Content-Type', /json/)
            .expect('Cache-Control', testUtils.cacheRules.private)
            .expect(201)
            .then((res) => {
                should.not.exist(res.headers['x-cache-invalidate']);
                const jsonResponse = res.body;

                should.exist(jsonResponse);
                should.exist(jsonResponse.webhooks);
                should.exist(jsonResponse.webhooks[0].event);
                should.exist(jsonResponse.webhooks[0].target_url);

                jsonResponse.webhooks[0].event.should.eql('test.create');
                jsonResponse.webhooks[0].target_url.should.eql('http://example.com/webhooks/test/extra/1');
                jsonResponse.webhooks[0].integration_id.should.eql(testUtils.DataGenerator.Content.api_keys[0].id);

                localUtils.API.checkResponse(jsonResponse.webhooks[0], 'webhook');
            });
    });
});
