const pool = require('../models/db');

function formatDueDate(dueDate) {
  if (!dueDate) return null;
  if (typeof dueDate === 'string') return dueDate.slice(0, 10);
  return dueDate.toISOString().slice(0, 10);
}

function mapCardRow(c) {
  return {
    id: String(c.id),
    title: c.title,
    description: c.description || '',
    labels: [],
    dueDate: formatDueDate(c.due_date),
    checklist: [],
    memberIds: [],
    archived: Boolean(c.archived),
    completed: Boolean(c.completed),
    activity: [],
    createdAt: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString(),
  };
}

async function getCardsByListId(listId) {
  const result = await pool.query(
    'SELECT * FROM cards WHERE list_id = $1 ORDER BY position',
    [listId]
  );
  return result.rows;
}

async function getCardWithDetails(cardId) {
  const card = await pool.query('SELECT * FROM cards WHERE id = $1', [cardId]);
  if (!card.rows[0]) return null;

  const labels = await pool.query(
    `SELECT l.* FROM labels l
     JOIN card_labels cl ON cl.label_id = l.id
     WHERE cl.card_id = $1`,
    [cardId]
  );

  const members = await pool.query(
    `SELECT u.* FROM users u
     JOIN card_members cm ON cm.user_id = u.id
     WHERE cm.card_id = $1`,
    [cardId]
  );

  const checklist = await pool.query(
    'SELECT * FROM checklist_items WHERE card_id = $1 ORDER BY position',
    [cardId]
  );

  return {
    ...card.rows[0],
    labels: labels.rows,
    members: members.rows,
    checklist: checklist.rows,
  };
}

async function createCard(title, listId, position) {
  let pos = position;
  if (pos === undefined || pos === null) {
    const next = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM cards WHERE list_id = $1',
      [listId]
    );
    pos = next.rows[0].next;
  }
  const result = await pool.query(
    'INSERT INTO cards (title, list_id, position) VALUES ($1, $2, $3) RETURNING *',
    [title, listId, pos]
  );
  return mapCardRow(result.rows[0]);
}

async function updateCard(id, fields) {
  const allowed = ['title', 'description', 'due_date', 'archived', 'completed'];
  const sets = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${idx}`);
      values.push(fields[key]);
      idx++;
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let updatedCard = null;
    if (sets.length > 0) {
      values.push(id);
      const result = await client.query(
        `UPDATE cards SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      updatedCard = result.rows[0];
    } else {
      const result = await client.query('SELECT * FROM cards WHERE id = $1', [id]);
      updatedCard = result.rows[0];
    }

    if (!updatedCard) {
      await client.query('ROLLBACK');
      return null;
    }

    if (fields.memberIds !== undefined) {
      await client.query('DELETE FROM card_members WHERE card_id = $1', [id]);
      for (const userId of fields.memberIds) {
        await client.query('INSERT INTO card_members (card_id, user_id) VALUES ($1, $2)', [id, userId]);
      }
    }

    if (fields.labels !== undefined) {
      await client.query('DELETE FROM card_labels WHERE card_id = $1', [id]);
      for (const label of fields.labels) {
        await client.query('INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2)', [id, label.id]);
      }
    }

    await client.query('COMMIT');
    return mapCardRow(updatedCard);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteCard(id) {
  await pool.query('DELETE FROM cards WHERE id = $1', [id]);
}

async function moveCard(cardId, destListId, destPosition) {
  const cid = Number(cardId);
  const lid = Number(destListId);
  const destIndex = Number(destPosition);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cardRes = await client.query('SELECT id, list_id FROM cards WHERE id = $1', [cid]);
    if (!cardRes.rows[0]) {
      await client.query('ROLLBACK');
      return;
    }
    const srcListId = cardRes.rows[0].list_id;

    const srcRows = await client.query(
      'SELECT id FROM cards WHERE list_id = $1 ORDER BY position ASC, id ASC',
      [srcListId]
    );
    const srcIds = srcRows.rows.map((r) => r.id).filter((id) => id !== cid);

    if (srcListId === lid) {
      const order = [...srcIds];
      order.splice(destIndex, 0, cid);
      for (let i = 0; i < order.length; i++) {
        await client.query('UPDATE cards SET list_id = $1, position = $2 WHERE id = $3', [lid, i, order[i]]);
      }
    } else {
      for (let i = 0; i < srcIds.length; i++) {
        await client.query('UPDATE cards SET position = $1 WHERE id = $2', [i, srcIds[i]]);
      }

      const destRows = await client.query(
        'SELECT id FROM cards WHERE list_id = $1 ORDER BY position ASC, id ASC',
        [lid]
      );
      const destIds = destRows.rows.map((r) => r.id).filter((id) => id !== cid);
      destIds.splice(destIndex, 0, cid);
      for (let i = 0; i < destIds.length; i++) {
        await client.query('UPDATE cards SET list_id = $1, position = $2 WHERE id = $3', [lid, i, destIds[i]]);
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function addLabel(cardId, labelId) {
  await pool.query(
    'INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [cardId, labelId]
  );
}

async function removeLabel(cardId, labelId) {
  await pool.query(
    'DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2',
    [cardId, labelId]
  );
}

async function addMember(cardId, userId) {
  await pool.query(
    'INSERT INTO card_members (card_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [cardId, userId]
  );
}

async function removeMember(cardId, userId) {
  await pool.query(
    'DELETE FROM card_members WHERE card_id = $1 AND user_id = $2',
    [cardId, userId]
  );
}

async function addChecklistItem(cardId, text, position) {
  const result = await pool.query(
    'INSERT INTO checklist_items (card_id, text, position) VALUES ($1, $2, $3) RETURNING *',
    [cardId, text, position]
  );
  return result.rows[0];
}

async function updateChecklistItem(itemId, fields) {
  const sets = [];
  const values = [];
  let idx = 1;

  if (fields.text !== undefined) { sets.push(`text = $${idx}`); values.push(fields.text); idx++; }
  if (fields.is_completed !== undefined) { sets.push(`is_completed = $${idx}`); values.push(fields.is_completed); idx++; }

  if (sets.length === 0) return null;
  values.push(itemId);

  const result = await pool.query(
    `UPDATE checklist_items SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0];
}

async function deleteChecklistItem(itemId) {
  await pool.query('DELETE FROM checklist_items WHERE id = $1', [itemId]);
}

module.exports = {
  getCardsByListId, getCardWithDetails, createCard, updateCard, deleteCard, moveCard,
  addLabel, removeLabel, addMember, removeMember,
  addChecklistItem, updateChecklistItem, deleteChecklistItem,
};
