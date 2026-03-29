const pool = require('../models/db');

async function getListsByBoardId(boardId) {
  const result = await pool.query(
    'SELECT * FROM lists WHERE board_id = $1 ORDER BY position',
    [boardId]
  );
  return result.rows;
}

async function createList(title, boardId, position) {
  let pos = position;
  if (pos === undefined || pos === null) {
    const next = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM lists WHERE board_id = $1',
      [boardId]
    );
    pos = next.rows[0].next;
  }
  const result = await pool.query(
    'INSERT INTO lists (title, board_id, position) VALUES ($1, $2, $3) RETURNING *',
    [title, boardId, pos]
  );
  const row = result.rows[0];
  return {
    id: String(row.id),
    title: row.title,
    cardIds: [],
  };
}

async function updateList(id, title) {
  const result = await pool.query(
    'UPDATE lists SET title = $1 WHERE id = $2 RETURNING *',
    [title, id]
  );
  return result.rows[0];
}

async function deleteList(id) {
  await pool.query('DELETE FROM lists WHERE id = $1', [id]);
}

async function reorderLists(orderedIds) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query('UPDATE lists SET position = $1 WHERE id = $2', [i, orderedIds[i]]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getListsByBoardId, createList, updateList, deleteList, reorderLists };
