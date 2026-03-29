const boardQueries = require('../queries/boardQueries');

async function getBoards(req, res) {
  try {
    const boards = await boardQueries.getAllBoardsFull();
    res.json(boards);
  } catch (err) {
    console.error('Error fetching boards:', err);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
}

async function createBoard(req, res) {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const board = await boardQueries.createBoard(title);
    res.status(201).json(board);
  } catch (err) {
    console.error('Error creating board:', err);
    res.status(500).json({ error: 'Failed to create board' });
  }
}

async function updateBoard(req, res) {
  try {
    const { id } = req.params;
    const { is_starred } = req.body;
    
    const fields = {};
    if (is_starred !== undefined) {
      fields.is_starred = is_starred;
    }
    
    const board = await boardQueries.updateBoard(id, fields);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json(board);
  } catch (err) {
    console.error('Error updating board:', err);
    res.status(500).json({ error: 'Failed to update board' });
  }
}

async function deleteBoard(req, res) {
  try {
    const { id } = req.params;
    await boardQueries.deleteBoard(id);
    res.json({ message: 'Board deleted' });
  } catch (err) {
    console.error('Error deleting board:', err);
    res.status(500).json({ error: 'Failed to delete board' });
  }
}

module.exports = { getBoards, createBoard, updateBoard, deleteBoard };
