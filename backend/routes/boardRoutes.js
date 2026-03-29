const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');

router.get('/', boardController.getBoards);
router.post('/', boardController.createBoard);
router.patch('/:id', boardController.updateBoard);
router.delete('/:id', boardController.deleteBoard);

module.exports = router;
