/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('payrolls', function (table) {
        table.increments('id').primary();

        table
            .integer('employee_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('employees')
            .onUpdate('CASCADE')
            .onDelete('CASCADE');

        table.integer('month').notNullable();
        table.integer('year').notNullable();
        table.date('payroll_date').notNullable();

        table.decimal('basic_salary', 10, 2).notNullable();

        table.decimal('allowances', 10, 2).notNullable().defaultTo(0);

        table.decimal('deductions', 10, 2).notNullable().defaultTo(0);

        table.decimal('net_salary', 10, 2).notNullable();

        table.enum('status', ['draft','paid','processed', 'unpaid']).notNullable().defaultTo('draft');

        table.timestamps(true, true);

        // One payroll record per employee per month
        table.unique([
            'employee_id',
            'payroll_date'
        ]);



    });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('payrolls');
  
};
