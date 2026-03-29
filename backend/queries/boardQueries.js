const pool = require('../models/db');

function formatDueDate(dueDate) {
  if (!dueDate) return null;
  if (typeof dueDate === 'string') return dueDate.slice(0, 10);
  return dueDate.toISOString().slice(0, 10);
}

function mapCardRow(c, labels = [], memberIds = []) {
  return {
    id: String(c.id),
    title: c.title,
    description: c.description || '',
    labels: labels,
    dueDate: formatDueDate(c.due_date),
    checklist: [],
    memberIds: memberIds,
    archived: Boolean(c.archived),
    completed: Boolean(c.completed),
    activity: [],
    createdAt: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString(),
  };
}

async function getAllBoardsFull() {
  const boardsResult = await pool.query('SELECT * FROM boards ORDER BY created_at');
  
  const allLabelsRes = await pool.query('SELECT cl.card_id, l.id, l.name as text, l.color FROM card_labels cl JOIN labels l ON cl.label_id = l.id');
  const allMembersRes = await pool.query('SELECT card_id, user_id FROM card_members');
  
  const labelsByCard = {};
  for (const row of allLabelsRes.rows) {
    if (!labelsByCard[row.card_id]) labelsByCard[row.card_id] = [];
    labelsByCard[row.card_id].push({ id: row.id, text: row.text, color: row.color });
  }
  
  const membersByCard = {};
  for (const row of allMembersRes.rows) {
    if (!membersByCard[row.card_id]) membersByCard[row.card_id] = [];
    membersByCard[row.card_id].push(row.user_id);
  }

  const boards = [];

  for (const board of boardsResult.rows) {
    const listsResult = await pool.query(
      'SELECT * FROM lists WHERE board_id = $1 ORDER BY position ASC, id ASC',
      [board.id],
    );
    const lists = [];
    const cards = {};

    for (const list of listsResult.rows) {
      const cardsResult = await pool.query(
        'SELECT * FROM cards WHERE list_id = $1 ORDER BY position ASC, id ASC',
        [list.id],
      );
      const cardIds = [];
      for (const c of cardsResult.rows) {
        const idStr = String(c.id);
        cardIds.push(idStr);
        cards[idStr] = mapCardRow(c, labelsByCard[c.id] || [], membersByCard[c.id] || []);
      }
      lists.push({
        id: String(list.id),
        title: list.title,
        cardIds,
      });
    }

    boards.push({
      id: String(board.id),
      title: board.title,
      isStarred: Boolean(board.is_starred),
      lists,
      cards,
    });
  }

  return boards;
}

async function getBoardById(id) {
  const result = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function createBoard(title) {
  const result = await pool.query('INSERT INTO boards (title) VALUES ($1) RETURNING *', [title]);
  const row = result.rows[0];
  return {
    id: String(row.id),
    title: row.title,
    isStarred: Boolean(row.is_starred),
    lists: [],
    cards: {},
  };
}

async function updateBoard(id, fields) {
  const sets = [];
  const values = [];
  let idx = 1;

  if (fields.is_starred !== undefined) {
    sets.push(`is_starred = $${idx}`);
    values.push(fields.is_starred);
    idx++;
  }

  if (sets.length === 0) return null;

  values.push(id);
  const result = await pool.query(
    `UPDATE boards SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0];
}

async function deleteBoard(id) {
  await pool.query('DELETE FROM boards WHERE id = $1', [id]);
}

module.exports = { getAllBoardsFull, getBoardById, createBoard, updateBoard, deleteBoard };
