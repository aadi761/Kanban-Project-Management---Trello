const pool = require('../models/db');
async function run() {
  try {
    await pool.query('ALTER TABLE boards ADD COLUMN is_starred BOOLEAN DEFAULT FALSE;');
    console.log('Successfully added is_starred column');
  } catch (err) {
    if (err.code === '42701') {
      console.log('Column already exists');
    } else {
      console.error(err);
    }
  } finally {
    process.exit(0);
  }
}
run();
