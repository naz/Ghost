const _ = require('lodash');

/**
 * @description Formats API response into handlebars/theme format.
 *
 * @return {Object} containing page variables
 */
function formatPageResponse(result) {
    var response = {};

    if (result.posts) {
        response.posts = result.posts;
    }

    if (result.meta && result.meta.pagination) {
        response.pagination = result.meta.pagination;
    }

    _.each(result.data, function (data, name) {
        if (data.meta) {
            // Move pagination to be a top level key
            response[name] = data;
            response[name].pagination = data.meta.pagination;
            delete response[name].meta;
        } else {
            // This is a single object, don't wrap it in an array
            response[name] = data[0];
        }
    });

    return response;
}

/**
 * @description Format a single resource for handlebars.
 *
 * @TODO
 * In the future, we should return {page: entry} or {post:entry).
 * But for now, we would break the themes if we just change it.
 *
 * @see https://github.com/TryGhost/Ghost/issues/10042.
 *
 * @return {Object} containing page variables
 */
function formatResponse(entry, type) {
    let singular = type.replace(/s$/i, '');
    let response = {
        post: entry
    };

    response[singular] = entry;

    return response;
}

module.exports = {
    entries: formatPageResponse,
    entry: formatResponse
};
