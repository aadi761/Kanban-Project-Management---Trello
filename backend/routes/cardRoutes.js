const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');

router.post('/', cardController.createCard);
router.patch('/move', cardController.moveCard);
router.patch('/:id', cardController.updateCard);
router.delete('/:id', cardController.deleteCard);

module.exports = router;
