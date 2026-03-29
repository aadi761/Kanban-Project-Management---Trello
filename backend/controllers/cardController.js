const cardQueries = require('../queries/cardQueries');

function mapBodyToCardFields(body) {
  const fields = {};
  if (body.title !== undefined) fields.title = body.title;
  if (body.description !== undefined) fields.description = body.description;
  if (body.due_date !== undefined) fields.due_date = body.due_date;
  if (body.archived !== undefined) fields.archived = body.archived;
  if (body.completed !== undefined) fields.completed = body.completed;
  if (body.dueDate !== undefined) fields.due_date = body.dueDate;
  if (body.labels !== undefined) fields.labels = body.labels;
  if (body.memberIds !== undefined) fields.memberIds = body.memberIds;
  return fields;
}

async function createCard(req, res) {
  try {
    const { title, list_id, position } = req.body;
    if (!title || list_id === undefined || list_id === null) {
      return res.status(400).json({ error: 'Title and list_id are required' });
    }
    const card = await cardQueries.createCard(title, list_id, position);
    res.status(201).json(card);
  } catch (err) {
    console.error('Error creating card:', err);
    res.status(500).json({ error: 'Failed to create card' });
  }
}

async function updateCard(req, res) {
  try {
    const { id } = req.params;
    const fields = mapBodyToCardFields(req.body);
    const card = await cardQueries.updateCard(id, fields);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.json(card);
  } catch (err) {
    console.error('Error updating card:', err);
    res.status(500).json({ error: 'Failed to update card' });
  }
}

async function deleteCard(req, res) {
  try {
    const { id } = req.params;
    await cardQueries.deleteCard(id);
    res.json({ message: 'Card deleted' });
  } catch (err) {
    console.error('Error deleting card:', err);
    res.status(500).json({ error: 'Failed to delete card' });
  }
}

async function moveCard(req, res) {
  try {
    const { card_id, dest_list_id, dest_position } = req.body;
    if (card_id === undefined || card_id === null || dest_list_id === undefined || dest_list_id === null) {
      return res.status(400).json({ error: 'card_id and dest_list_id are required' });
    }
    if (dest_position === undefined || dest_position === null) {
      return res.status(400).json({ error: 'dest_position is required' });
    }
    await cardQueries.moveCard(card_id, dest_list_id, dest_position);
    res.json({ message: 'Card moved' });
  } catch (err) {
    console.error('Error moving card:', err);
    res.status(500).json({ error: 'Failed to move card' });
  }
}

module.exports = { createCard, updateCard, deleteCard, moveCard };
