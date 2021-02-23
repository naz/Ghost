const {createIrreversibleMigration} = require('../../utils');
const logging = require('../../../../../shared/logging');

module.exports = createIrreversibleMigration(async (knex) => {
    logging.info('Populating posts.metadata_id based on metadata.post_id');

    const metadataPostIDs = await knex
        .select(
            'id as metadata_id',
            'post_id'
        )
        .from('metadata');

    for (const metadataPostPair in metadataPostIDs) {
        logging.info(`Updating post ${metadataPostPair.post_id} with metadata_id: ${metadataPostPair.metadata_id}`);

        await knex('posts')
            .update({
                metadata_id: metadataPostPair.metadata_id
            })
            .where({
                id: metadataPostPair.post_id
            });
    }
});
