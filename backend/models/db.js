const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/trello';

const pool = new Pool({
  connectionString,
  max: 10,
});

module.exports = pool;
