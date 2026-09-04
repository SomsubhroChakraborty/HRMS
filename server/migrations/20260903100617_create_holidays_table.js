/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
    return knex.schema.createTable('holidays', function (table) {
        table.increments('id').primary();

        table
            .string('holiday_name', 150)
            .notNullable();

        table
            .date('holiday_date')
            .notNullable()
            .unique();

        table
            .enum('holiday_type', [
                'public',
                'company',
                'festival',
                'other'
            ])
            .notNullable()
            .defaultTo('company');

        table
            .boolean('is_paid')
            .notNullable()
            .defaultTo(true);

        table.text('remarks').nullable();

        table.timestamps(true, true);
    });
};


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('holidays');
};