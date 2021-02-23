const logging = require('../../../../../shared/logging');
const {createIrreversibleMigration} = require('../../utils');

const fromTable = 'posts_meta';
const toTable = 'metadata';

module.exports = createIrreversibleMigration(async (knex) => {
    const hasTable = await knex.schema.hasTable(fromTable);

    if (!hasTable) {
        logging.warn(`No ${fromTable} table found, skipping this migration`);
        return;
    }

    logging.info(`Renaming ${fromTable} table to ${toTable}`);

    await knex.schema.renameTable(fromTable, toTable);
});
