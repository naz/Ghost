const jsonSchema = require('../utils/json-schema');

module.exports = {
    add(apiConfig, frame) {
        const schema = require('./schemas/webhooks-add');
        const definitions = require('./schemas/webhooks');
        return jsonSchema.validate(schema, definitions, frame.data);
    },

    edit(apiConfig, frame) {
        const schema = require('./schemas/webhooks-edit');
        const definitions = require('./schemas/webhooks');
        return jsonSchema.validate(schema, definitions, frame.data);
    }
};
