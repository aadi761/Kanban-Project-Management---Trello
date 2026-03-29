const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Boards ───

export async function getBoards() {
  const res = await fetch(`${API_BASE}/boards`);
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `GET ${API_BASE}/boards failed (${res.status}${detail ? `: ${detail.slice(0, 120)}` : ''})`,
    );
  }
  return res.json();
}

export async function createBoard(title) {
  const res = await fetch(`${API_BASE}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create board');
  return res.json();
}

export async function updateBoard(id, updates) {
  const res = await fetch(`${API_BASE}/boards/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update board');
  return res.json();
}

export async function deleteBoard(id) {
  const res = await fetch(`${API_BASE}/boards/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete board');
  return res.json();
}

// ─── Lists ───

export async function getLists(boardId) {
  const res = await fetch(`${API_BASE}/lists/${boardId}`);
  if (!res.ok) throw new Error('Failed to fetch lists');
  return res.json();
}

export async function createList(title, boardId, position) {
  const body = { title, board_id: boardId };
  if (position !== undefined && position !== null) body.position = position;
  const res = await fetch(`${API_BASE}/lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to create list');
  return res.json();
}

export async function updateList(id, title) {
  const res = await fetch(`${API_BASE}/lists/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to update list');
  return res.json();
}

export async function deleteList(id) {
  const res = await fetch(`${API_BASE}/lists/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete list');
  return res.json();
}

export async function reorderLists(orderedIds) {
  const res = await fetch(`${API_BASE}/lists/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error('Failed to reorder lists');
  return res.json();
}

// ─── Cards ───

export async function createCard(title, listId, position) {
  const body = { title, list_id: listId };
  if (position !== undefined && position !== null) body.position = position;
  const res = await fetch(`${API_BASE}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to create card');
  return res.json();
}

export async function updateCard(id, fields) {
  const res = await fetch(`${API_BASE}/cards/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error('Failed to update card');
  return res.json();
}

export async function deleteCard(id) {
  const res = await fetch(`${API_BASE}/cards/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete card');
  return res.json();
}

export async function moveCard(cardId, destListId, destPosition) {
  const res = await fetch(`${API_BASE}/cards/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ card_id: cardId, dest_list_id: destListId, dest_position: destPosition }),
  });
  if (!res.ok) throw new Error('Failed to move card');
  return res.json();
}
