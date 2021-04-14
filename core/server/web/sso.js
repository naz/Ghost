const express = require('../../shared/express');
const config = require('../../shared/config');
const logging = require('../../shared/logging');

const {generators} = require('openid-client');
const {Issuer} = require('openid-client');

const codeVerifier = generators.codeVerifier();

// const settings = require('../services/settings/cache');

// const dangerousGoogleClientID = settings.get('sso_google_client_id');
// const dangerousGoogleClientSecret = settings.get('sso_google_client_secret');

const dangerousGoogleClientID = config.get('adapters:sso:google:clientId');
const dangerousGoogleClientSecret = config.get('adapters:sso:google:clientSecret');

const redirectURL = 'https://a6dd14aa99e3.ngrok.io/ghost/sso/google';

let client;

const ensureClient = async () => {
    if (!client) {
        try {
            const googleIssuer = await Issuer.discover('https://accounts.google.com');

            logging.info('Discovered issuer %s %O', googleIssuer.issuer, googleIssuer.metadata);

            client = new googleIssuer.Client({
                client_id: dangerousGoogleClientID,
                client_secret: dangerousGoogleClientSecret,
                redirect_uris: [redirectURL],
                response_types: ['code'],
                id_token_signed_response_alg: 'RS256',
                token_endpoint_auth_method: 'client_secret_basic'
            });
        } catch (err) {
            logging.error(err);
            throw err;
        }
    }
};

module.exports = function setupSSO() {
    const ssoApp = express('sso');

    ssoApp.get('/google', async (req, res) => {
        await ensureClient();

        const codeChallenge = generators.codeChallenge(codeVerifier);

        const authorizationUrl = client.authorizationUrl({
            scope: 'email profile',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });

        res.redirect(authorizationUrl);
    });

    ssoApp.post('/google', async (req, res) => {
        await ensureClient();

        const params = client.callbackParams(req);

        const tokenSet = await client.callback(redirectURL, params, {codeVerifier});

        logging.info('received and validated tokens %j', tokenSet);
        logging.info('validated ID Token claims %j', tokenSet.claims());

        res.send(200);
    });

    return ssoApp;
};
