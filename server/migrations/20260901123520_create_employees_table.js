/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('employees', function (table) {
    table.increments('id').primary();

    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .unique()
      .references('id')
      .inTable('users')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');

    table.string('employee_code', 50).notNullable().unique();

    table.string('phone', 20).nullable();

    table.date('date_of_birth').nullable();

    table.string('gender', 20).nullable();

    table.text('address').nullable();

    table
      .integer('department_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('departments')
      .onUpdate('CASCADE')
      .onDelete('RESTRICT');

    table
      .integer('designation_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('designations')
      .onUpdate('CASCADE')
      .onDelete('RESTRICT');

    table.date('joining_date').notNullable();

    table
      .enum('employment_status', [
        'active',
        'inactive',
        'resigned',
        'terminated'
      ])
      .notNullable()
      .defaultTo('active');

    // Bank details
    table.string('bank_name', 150).nullable();

    table.string('account_holder_name', 150).nullable();

    table.string('account_number', 100).nullable();

    table.string('ifsc_code', 20).nullable();

    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('employees');
};