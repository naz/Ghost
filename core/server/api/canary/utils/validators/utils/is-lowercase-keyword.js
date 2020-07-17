/**
 * 'strip' keyword is introduced into schemas for following behavior:
 * properties that are 'known' but should not be present in the model
 * should be stripped from data and not throw validation errors.
 *
 * An example of such property is `tag.parent` which we want to ignore
 * but not necessarily throw a validation error as it was present in
 * responses in previous versions of API
 */
module.exports = function defFunc(ajv) {
    defFunc.definition = {
        errors: false,
        validate: function (schema, data) {
            if (data) {
                return data === data.toLowerCase();
            }

            return true;
        }
    };

    ajv.addKeyword('isLowercase', defFunc.definition);
    return ajv;
};
