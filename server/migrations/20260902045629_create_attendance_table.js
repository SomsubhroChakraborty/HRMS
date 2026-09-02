/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return knex.schema.createTable('attendance', function (table) {
    table.increments('id').primary();

    table
      .integer('employee_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('employees')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');

    table.date('attendance_date').notNullable();

    table.timestamp('clock_in').nullable();

    table.timestamp('clock_out').nullable();

    table
      .enum('status', [
        'present',
        'late',
        'half_day',
        'absent',
        'leave'
      ])
      .notNullable()
      .defaultTo('present');

    table
      .integer('late_minutes')
      .notNullable()
      .defaultTo(0);

    table
      .integer('early_departure_minutes')
      .notNullable()
      .defaultTo(0);

    table
      .integer('working_minutes')
      .notNullable()
      .defaultTo(0);

    table.text('remarks').nullable();

    table.timestamps(true, true);

    // One attendance record per employee per day
    table.unique([
      'employee_id',
      'attendance_date'
    ]);
  });
};


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('attendance');
};