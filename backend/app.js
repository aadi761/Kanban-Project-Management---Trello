const express = require('express');
const cors = require('cors');

const boardRoutes = require('./routes/boardRoutes');
const listRoutes = require('./routes/listRoutes');
const cardRoutes = require('./routes/cardRoutes');

const app = express();

/** Comma-separated origins, e.g. https://app.vercel.app,https://preview.vercel.app — optional trailing slashes stripped */
function buildCorsOrigin() {
  const raw = process.env.FRONTEND_URL || '';
  const list = raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (list.length === 0) {
    return true;
  }
  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const normalized = origin.replace(/\/$/, '');
    if (list.includes(normalized)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  };
}

app.use(cors({ origin: buildCorsOrigin(), credentials: true }));
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
