const listQueries = require('../queries/listQueries');

async function getLists(req, res) {
  try {
    const { boardId } = req.params;
    const lists = await listQueries.getListsByBoardId(boardId);
    res.json(lists);
  } catch (err) {
    console.error('Error fetching lists:', err);
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
}

async function createList(req, res) {
  try {
    const { title, board_id, position } = req.body;
    if (!title || !board_id) return res.status(400).json({ error: 'Title and board_id are required' });
    const list = await listQueries.createList(title, board_id, position);
    res.status(201).json(list);
  } catch (err) {
    console.error('Error creating list:', err);
    res.status(500).json({ error: 'Failed to create list' });
  }
}

async function updateList(req, res) {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const list = await listQueries.updateList(id, title);
    if (!list) return res.status(404).json({ error: 'List not found' });
    res.json(list);
  } catch (err) {
    console.error('Error updating list:', err);
    res.status(500).json({ error: 'Failed to update list' });
  }
}

async function deleteList(req, res) {
  try {
    const { id } = req.params;
    await listQueries.deleteList(id);
    res.json({ message: 'List deleted' });
  } catch (err) {
    console.error('Error deleting list:', err);
    res.status(500).json({ error: 'Failed to delete list' });
  }
}

async function reorderLists(req, res) {
  try {
    const { orderedIds } = req.body;
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds array is required' });
    }
    await listQueries.reorderLists(orderedIds);
    res.json({ message: 'Lists reordered' });
  } catch (err) {
    console.error('Error reordering lists:', err);
    res.status(500).json({ error: 'Failed to reorder lists' });
  }
}

module.exports = { getLists, createList, updateList, deleteList, reorderLists };
