'use strict';

const { Sequelize } = require('sequelize');

let readonlyInstance = null;

function getReadonlySequelize() {
  if (readonlyInstance) return readonlyInstance;

  const user = process.env.DB_READONLY_USER;
  const password = process.env.DB_READONLY_PASSWORD;

  if (!user || !password) {
    throw new Error(
      'DB_READONLY_USER and DB_READONLY_PASSWORD must be set before AI SQL queries can execute. ' +
      'Create a PostgreSQL role with SELECT-only grants and set these environment variables.'
    );
  }

  const dialectOptions = {
    statement_timeout: 10000,           // cancel query server-side after 10s
    idle_in_transaction_session_timeout: 15000,
  };

  if (process.env.DB_SSL === 'true') {
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    };
  }

  readonlyInstance = new Sequelize(
    process.env.DB_NAME || 'fact_db',
    user,
    password,
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      dialect: 'postgres',
      pool: { max: 3, min: 0, acquire: 15000, idle: 10000 },
      dialectOptions,
      logging: false,
      timezone: '+05:30',
    }
  );

  return readonlyInstance;
}

module.exports = { getReadonlySequelize };
