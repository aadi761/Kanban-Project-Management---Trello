const express = require('express');
const cors = require('cors');

const boardRoutes = require('./routes/boardRoutes');
const listRoutes = require('./routes/listRoutes');
const cardRoutes = require('./routes/cardRoutes');

const app = express();

const corsOrigin = process.env.FRONTEND_URL || true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app;
