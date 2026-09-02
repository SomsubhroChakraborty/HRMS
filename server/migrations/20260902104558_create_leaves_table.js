exports.up = function (knex) {
    return knex.schema.createTable('leaves', function (table) {
        table.increments('id').primary();

        table
            .integer('employee_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('employees')
            .onDelete('CASCADE');

        table.enum('leave_type', [
            'casual',
            'sick',
            'paid',
            'unpaid',
            'other'
        ]).notNullable();

        table.date('start_date').notNullable();

        table.date('end_date').notNullable();

        table.text('reason').nullable();

        table.enum('status', [
            'pending',
            'approved',
            'rejected'
        ]).notNullable().defaultTo('pending');

        table
            .integer('approved_by')
            .unsigned()
            .nullable()
            .references('id')
            .inTable('users')
            .onDelete('SET NULL');

        table.text('admin_remarks').nullable();

        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('leaves');
};