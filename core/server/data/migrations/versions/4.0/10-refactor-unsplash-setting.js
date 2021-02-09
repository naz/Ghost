const {createTransactionalMigration} = require('../../utils');

module.exports = createTransactionalMigration(
    async function up(knex) {
        const unsplashSetting = await knex('settings')
            .select('value')
            .where({
                key: 'unsplash'
            })
            .first();

        let isActive;
        try {
            const value = JSON.parse(unsplashSetting.value);
            isActive = typeof value.isActive === 'boolean' ? value.isActive : true;
        } catch (err) {
            isActive = true;
        }

        await knex('settings')
            .update({
                group: 'unsplash',
                type: 'boolean',
                flags: null,
                value: isActive.toString()
            })
            .where({
                key: 'unsplash'
            });
    },

    async function down() {
        // this is a major version migration, so there is no need for back compatibility
        // less code - less scenarios to think about
    }
);