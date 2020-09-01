const _ = require('lodash');
const crypto = require('crypto');
const debug = require('ghost-ignition').debug('frontend:services:settings:index');
const SettingsLoader = require('./loader');
const ensureSettingsFiles = require('./ensure-settings');

const errors = require('@tryghost/errors');

let currentRoutesHash;

module.exports = {

    init: function () {
        const knownSettings = this.knownSettings();

        debug('init settings service for:', knownSettings);

        // Make sure that supported settings files are available
        // inside of the `content/setting` directory
        return ensureSettingsFiles(knownSettings)
            .then((settingResults) => {
                const routesYaml = settingResults[0];
                currentRoutesHash = crypto.createHash('md5').update(routesYaml, 'binary').digest('hex');
            });
    },

    /**
    * Global place to switch on more available settings.
    */
    knownSettings: function knownSettings() {
        return ['routes'];
    },

    /**
     * Getter for YAML settings.
     * Example: `settings.get('routes').then(...)`
     * will return an Object like this:
     * {routes: {}, collections: {}, resources: {}}
     * @param {String} setting type of supported setting.
     * @returns {Object} settingsFile
     * @description Returns settings object as defined per YAML files in
     * `/content/settings` directory.
     */
    get: function get(setting) {
        const knownSettings = this.knownSettings();

        // CASE: this should be an edge case and only if internal usage of the
        // getter is incorrect.
        if (!setting || _.indexOf(knownSettings, setting) < 0) {
            throw new errors.IncorrectUsageError({
                message: `Requested setting is not supported: '${setting}'.`,
                help: `Please use only the supported settings: ${knownSettings}.`
            });
        }

        return SettingsLoader(setting);
    },

    /**
     * Getter for all YAML settings.
     * Example: `settings.getAll().then(...)`
     * will return an Object like this (assuming we're supporting `routes`
     * and `globals`):
     * {
     *     routes: {
     *         routes: null,
     *         collections: { '/': [Object] },
     *         resources: { tag: '/tag/{slug}/', author: '/author/{slug}/' }
     *     },
     *     globals: {
     *         config: { url: 'testblog.com' }
     *     }
     * }
     * @returns {Object} settingsObject
     * @description Returns all settings object as defined per YAML files in
     * `/content/settings` directory.
     */
    getAll: function getAll() {
        const knownSettings = this.knownSettings();
        const settingsToReturn = {};

        _.each(knownSettings, function (setting) {
            settingsToReturn[setting] = SettingsLoader(setting);
        });

        return settingsToReturn;
    },

    getDefaultRoutesHash: () => 'c2830292f2e8f43ec9de27a90aa287b1',
    getCurrentRoutesHash: () => currentRoutesHash
};
