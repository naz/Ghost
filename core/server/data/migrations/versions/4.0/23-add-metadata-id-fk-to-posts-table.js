const {createAddColumnMigration} = require('../../utils');

module.exports = createAddColumnMigration('posts', 'metadata_id', {
    type: 'string',
    maxlength: 24,
    nullable: true,
    references: 'metadata.id',
    unique: true
});
