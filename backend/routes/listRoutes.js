const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');

router.get('/:boardId', listController.getLists);
router.post('/', listController.createList);
router.patch('/reorder', listController.reorderLists);
router.patch('/:id', listController.updateList);
router.delete('/:id', listController.deleteList);

module.exports = router;
