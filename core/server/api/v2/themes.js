const common = require('../../lib/common');
const themeService = require('../../../frontend/services/themes');
const models = require('../../models');

module.exports = {
    docName: 'themes',

    browse: {
        permissions: true,
        query() {
            return themeService.settings.get();
        }
    },

    activate: {
        headers: {
            cacheInvalidate: true
        },
        options: [
            'name'
        ],
        validation: {
            options: {
                name: {
                    required: true
                }
            }
        },
        permissions: true,
        query(frame) {
            let themeName = frame.options.name;
            const newSettings = [{
                key: 'active_theme',
                value: themeName
            }];

            return themeService.activate(themeName)
                .then((checkedTheme) => {
                    // @NOTE: we use the model, not the API here, as we don't want to trigger permissions
                    return models.Settings.edit(newSettings, frame.options)
                        .then(() => checkedTheme);
                })
                .then((checkedTheme) => {
                    return themeService.settings.get(themeName, checkedTheme);
                });
        }
    },

    upload: {
        headers: {},
        permissions: {
            method: 'add'
        },
        query(frame) {
            // @NOTE: consistent filename uploads
            frame.options.originalname = frame.file.originalname.toLowerCase();

            let zip = {
                path: frame.file.path,
                name: frame.file.originalname
            };

            return themeService.settings.setFromZip(zip)
                .then((theme) => {
                    common.events.emit('theme.uploaded');
                    return theme;
                });
        }
    },

    download: {
        options: [
            'name'
        ],
        validation: {
            options: {
                name: {
                    required: true
                }
            }
        },
        permissions: {
            method: 'read'
        },
        query(frame) {
            let themeName = frame.options.name;

            return themeService.settings.getZip(themeName);
        }
    },

    destroy: {
        statusCode: 204,
        headers: {
            cacheInvalidate: true
        },
        options: [
            'name'
        ],
        validation: {
            options: {
                name: {
                    required: true
                }
            }
        },
        permissions: true,
        query(frame) {
            let themeName = frame.options.name;

            return themeService.settings.destroy(themeName);
        }
    }
};
