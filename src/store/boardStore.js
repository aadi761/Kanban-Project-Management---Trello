import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as api from '@/api.js';

function normalizeCard(card) {
  if (!card) return card;
  return {
    ...card,
    activity: Array.isArray(card.activity) ? card.activity : [],
    completed: Boolean(card.completed),
    memberIds: (card.memberIds || []).map((id) => Number(id)),
  };
}

function normalizeBoard(board) {
  if (!board) return board;
  const cards = {};
  for (const [id, c] of Object.entries(board.cards || {})) {
    cards[id] = normalizeCard(c);
  }
  return { ...board, cards };
}

/** Offline fallback only when `npm run dev` and the API is down — never used in production builds. */
function createSeedData() {
  const board = {
    id: uuidv4(),
    title: 'Local dev board',
    lists: [],
    cards: {},
  };

  const cards = {};

  const c1 = {
    id: uuidv4(),
    title: 'Example card',
    description: 'Start the API or use Neon + Render so this seed is not needed.',
    labels: [{ id: uuidv4(), text: 'Demo', color: 'blue' }],
    dueDate: null,
    checklist: [],
    memberIds: [],
    archived: false,
    completed: false,
    activity: [],
    createdAt: new Date().toISOString(),
  };

  cards[c1.id] = c1;

  board.lists = [{ id: uuidv4(), title: 'To do', cardIds: [c1.id] }];
  board.cards = cards;

  return [normalizeBoard(board)];
}

export function useBoardStore() {
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadBoards = useCallback(async (preserveActive = false) => {
    try {
      setLoadError(null);
      const data = await api.getBoards();
      if (data && data.length > 0) {
        setBoards(data.map(normalizeBoard));
        if (!preserveActive) setActiveBoardId(data[0].id);
      } else {
        setBoards([]);
        if (!preserveActive) setActiveBoardId('');
      }
    } catch (err) {
      console.error('Failed to load boards:', err);
      const message =
        err instanceof Error ? err.message : 'Network or server error when calling the API.';
      if (import.meta.env.DEV) {
        console.info('DEV: API unreachable — showing local seed data.');
        if (!preserveActive) {
          const seed = createSeedData();
          setBoards(seed);
          setActiveBoardId(seed[0].id);
          setLoadError(null);
        }
      } else {
        setLoadError(message);
        setBoards([]);
        if (!preserveActive) setActiveBoardId('');
      }
    } finally {
      if (!preserveActive) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const retryLoad = useCallback(() => {
    setLoading(true);
    loadBoards();
  }, [loadBoards]);

  const update = useCallback((updater) => {
    setBoards((prev) => updater(prev));
  }, []);

  const activeBoard = boards.find((b) => b.id === activeBoardId) || null;

  const switchBoard = useCallback((id) => {
    setActiveBoardId(id);
  }, []);

  const createBoard = useCallback(async (title) => {
    const tempId = uuidv4();
    const newBoard = { id: tempId, title, isStarred: false, lists: [], cards: {} };
    update((prev) => [...prev, newBoard]);
    setActiveBoardId(tempId);
    try {
      const created = await api.createBoard(title);
      setActiveBoardId(created.id);
      update((prev) => prev.map((b) => (b.id === tempId ? normalizeBoard(created) : b)));
    } catch (err) {
      console.error('Failed to create board via API:', err);
    }
  }, [update]);

  const updateBoardTitle = useCallback(async (title) => {
    if (!activeBoardId) return;
    update((prev) => prev.map((b) => (b.id === activeBoardId ? { ...b, title } : b)));
    try {
      await api.updateBoard(activeBoardId, { title });
    } catch (err) {
      console.error('Failed to update board title via API:', err);
    }
  }, [activeBoardId, update]);

  const toggleBoardStar = useCallback(async () => {
    if (!activeBoardId) return;
    let nextStarred = false;
    update((prev) => prev.map((b) => {
      if (b.id === activeBoardId) {
        nextStarred = !b.isStarred;
        return { ...b, isStarred: nextStarred };
      }
      return b;
    }));
    try {
      await api.updateBoard(activeBoardId, { is_starred: nextStarred });
    } catch (err) {
      console.error('Failed to update board star via API:', err);
    }
  }, [activeBoardId, update]);

  const deleteBoard = useCallback(async (boardId) => {
    update((prev) => {
      const remaining = prev.filter(b => b.id !== boardId);
      if (activeBoardId === boardId) {
        if (remaining.length > 0) {
          setActiveBoardId(remaining[0].id);
        } else {
          setActiveBoardId(null);
        }
      }
      return remaining;
    });
    try {
      await api.deleteBoard(boardId);
    } catch (err) {
      console.error('Failed to delete board via API:', err);
    }
  }, [activeBoardId, update]);

  const addList = useCallback(async (title) => {
    const tempId = uuidv4();
    update((prev) =>
      prev.map((b) =>
        b.id === activeBoardId
          ? { ...b, lists: [...b.lists, { id: tempId, title, cardIds: [] }] }
          : b,
      ),
    );
    try {
      const created = await api.createList(title, activeBoardId);
      update((prev) =>
        prev.map((b) =>
          b.id === activeBoardId
            ? {
                ...b,
                lists: b.lists.map((l) =>
                  l.id === tempId ? { id: created.id, title: created.title, cardIds: created.cardIds || [] } : l,
                ),
              }
            : b,
        ),
      );
    } catch (err) {
      console.error('Failed to create list via API:', err);
    }
  }, [activeBoardId, update]);

  const updateListTitle = useCallback(
    async (listId, title) => {
      update((prev) =>
        prev.map((b) =>
          b.id === activeBoardId ? { ...b, lists: b.lists.map((l) => (l.id === listId ? { ...l, title } : l)) } : b,
        ),
      );
      try {
        await api.updateList(listId, title);
      } catch (err) {
        console.error('Failed to update list via API:', err);
      }
    },
    [activeBoardId, update],
  );

  const deleteList = useCallback(
    async (listId) => {
      update((prev) =>
        prev.map((b) => {
          if (b.id !== activeBoardId) return b;
          const list = b.lists.find((l) => l.id === listId);
          const newCards = { ...b.cards };
          list?.cardIds.forEach((cid) => delete newCards[cid]);
          return { ...b, lists: b.lists.filter((l) => l.id !== listId), cards: newCards };
        }),
      );
      try {
        await api.deleteList(listId);
      } catch (err) {
        console.error('Failed to delete list via API:', err);
      }
    },
    [activeBoardId, update],
  );

  const copyList = useCallback(async (listId, newTitle) => {
    const listToCopy = activeBoard?.lists.find((l) => l.id === listId);
    if (!listToCopy || !activeBoardId) return;

    try {
      const createdList = await api.createList(newTitle, activeBoardId);

      for (const cardId of listToCopy.cardIds) {
        const origCard = activeBoard.cards[cardId];
        if (!origCard) continue;

        const newCard = await api.createCard(origCard.title, createdList.id);

        const updates = {
          description: origCard.description,
          dueDate: origCard.dueDate,
          archived: origCard.archived,
          completed: origCard.completed,
          memberIds: origCard.memberIds,
          labels: origCard.labels,
        };

        if (Object.keys(updates).length > 0) {
          await api.updateCard(newCard.id, updates);
        }

        if (origCard.checklist && origCard.checklist.length > 0) {
          for (const item of origCard.checklist) {
            const newItem = await api.addChecklistItem(newCard.id, item.text);
            if (item.completed || item.is_completed) {
              await api.updateChecklistItem(newItem.id, { is_completed: true });
            }
          }
        }
      }

      await loadBoards(true);
    } catch (err) {
      console.error('Failed to copy list via API:', err);
    }
  }, [activeBoard, activeBoardId, loadBoards]);

  const sortList = useCallback((listId, sortBy) => {
    update((prev) => prev.map(board => {
      if (board.id !== activeBoardId) return board;
      const newLists = [...board.lists];
      const listIndex = newLists.findIndex(l => l.id === listId);
      if (listIndex === -1) return board;
      
      const list = newLists[listIndex];
      const cardIds = [...list.cardIds];
      
      cardIds.sort((a, b) => {
        const cardA = board.cards[a];
        const cardB = board.cards[b];
        if (sortBy === 'newest') {
          return new Date(cardB.createdAt).getTime() - new Date(cardA.createdAt).getTime();
        } else if (sortBy === 'oldest') {
          return new Date(cardA.createdAt).getTime() - new Date(cardB.createdAt).getTime();
        } else if (sortBy === 'dueDate') {
          if (!cardA.dueDate) return 1;
          if (!cardB.dueDate) return -1;
          return new Date(cardA.dueDate).getTime() - new Date(cardB.dueDate).getTime();
        }
        return 0;
      });

      newLists[listIndex] = { ...list, cardIds };
      return { ...board, lists: newLists };
    }));
  }, [activeBoardId, update]);

  const addCard = useCallback(
    async (listId, title) => {
      const tempId = uuidv4();
      const card = {
        id: tempId,
        title,
        description: '',
        labels: [],
        dueDate: null,
        checklist: [],
        memberIds: [],
        archived: false,
        completed: false,
        activity: ['Card created'],
        createdAt: new Date().toISOString(),
      };
      update((prev) =>
        prev.map((b) => {
          if (b.id !== activeBoardId) return b;
          return {
            ...b,
            cards: { ...b.cards, [tempId]: card },
            lists: b.lists.map((l) => (l.id === listId ? { ...l, cardIds: [...l.cardIds, tempId] } : l)),
          };
        }),
      );
      try {
        const created = await api.createCard(title, listId);
        update((prev) =>
          prev.map((b) => {
            if (b.id !== activeBoardId) return b;
            const nextCards = { ...b.cards };
            delete nextCards[tempId];
            const merged = normalizeCard({
              ...created,
              activity: [...(normalizeCard(created).activity || []), 'Card created'],
            });
            nextCards[created.id] = merged;
            return {
              ...b,
              cards: nextCards,
              lists: b.lists.map((l) =>
                l.id === listId ? { ...l, cardIds: l.cardIds.map((cid) => (cid === tempId ? created.id : cid)) } : l,
              ),
            };
          }),
        );
      } catch (err) {
        console.error('Failed to create card via API:', err);
      }
    },
    [activeBoardId, update],
  );

  const updateCard = useCallback(
    async (cardId, updates) => {
      update((prev) =>
        prev.map((b) =>
          b.id === activeBoardId
            ? { ...b, cards: { ...b.cards, [cardId]: normalizeCard({ ...b.cards[cardId], ...updates }) } }
            : b,
        ),
      );
      const { activity: _a, checklist: _c, ...apiFields } = updates;
      const payload = {};
      if (apiFields.title !== undefined) payload.title = apiFields.title;
      if (apiFields.description !== undefined) payload.description = apiFields.description;
      if (apiFields.dueDate !== undefined) payload.dueDate = apiFields.dueDate;
      if (apiFields.archived !== undefined) payload.archived = apiFields.archived;
      if (apiFields.completed !== undefined) payload.completed = apiFields.completed;
      if (apiFields.labels !== undefined) payload.labels = apiFields.labels;
      if (apiFields.memberIds !== undefined) payload.memberIds = apiFields.memberIds;
      if (Object.keys(payload).length === 0) return;
      try {
        await api.updateCard(cardId, payload);
      } catch (err) {
        console.error('Failed to update card via API:', err);
      }
    },
    [activeBoardId, update],
  );

  const deleteCard = useCallback(
    async (cardId) => {
      update((prev) =>
        prev.map((b) => {
          if (b.id !== activeBoardId) return b;
          const newCards = { ...b.cards };
          delete newCards[cardId];
          return {
            ...b,
            cards: newCards,
            lists: b.lists.map((l) => ({ ...l, cardIds: l.cardIds.filter((id) => id !== cardId) })),
          };
        }),
      );
      try {
        await api.deleteCard(cardId);
      } catch (err) {
        console.error('Failed to delete card via API:', err);
      }
    },
    [activeBoardId, update],
  );

  const toggleCardComplete = useCallback(
    async (cardId) => {
      let payload = null;
      update((prev) =>
        prev.map((b) => {
          if (b.id !== activeBoardId) return b;
          const c = b.cards[cardId];
          if (!c) return b;
          const nextCompleted = !c.completed;
          payload = { completed: nextCompleted };
          const activity = [
            ...(c.activity || []),
            nextCompleted ? 'Card marked complete' : 'Card marked incomplete',
          ];
          return {
            ...b,
            cards: {
              ...b.cards,
              [cardId]: { ...c, completed: nextCompleted, activity },
            },
          };
        }),
      );
      if (payload) {
        try {
          await api.updateCard(cardId, payload);
        } catch (err) {
          console.error('Failed to update card via API:', err);
        }
      }
    },
    [activeBoardId, update],
  );

  const moveCard = useCallback(
    async (sourceListId, destListId, sourceIndex, destIndex) => {
      let movedCardId = null;
      update((prev) =>
        prev.map((b) => {
          if (b.id !== activeBoardId) return b;
          const newLists = b.lists.map((l) => ({ ...l, cardIds: [...l.cardIds] }));
          const srcList = newLists.find((l) => l.id === sourceListId);
          if (!srcList) return b;
          const [movedId] = srcList.cardIds.splice(sourceIndex, 1);
          movedCardId = movedId;
          const destList = newLists.find((l) => l.id === destListId);
          if (!destList) return b;
          destList.cardIds.splice(destIndex, 0, movedId);

          let cards = { ...b.cards };
          if (sourceListId !== destListId && movedId && b.cards[movedId]) {
            const destTitle = destList.title || '';
            const c = b.cards[movedId];
            const activity = [...(c.activity || []), `Moved to ${destTitle}`];
            cards = { ...cards, [movedId]: { ...c, activity } };
          }
          return { ...b, lists: newLists, cards };
        }),
      );
      try {
        if (movedCardId) {
          await api.moveCard(movedCardId, destListId, destIndex);
        }
      } catch (err) {
        console.error('Failed to move card via API:', err);
      }
    },
    [activeBoardId, update],
  );

  const moveList = useCallback(
    async (sourceIndex, destIndex) => {
      let orderedIds = [];
      update((prev) =>
        prev.map((b) => {
          if (b.id !== activeBoardId) return b;
          const newLists = [...b.lists];
          const [moved] = newLists.splice(sourceIndex, 1);
          newLists.splice(destIndex, 0, moved);
          orderedIds = newLists.map((l) => l.id);
          return { ...b, lists: newLists };
        }),
      );
      try {
        await api.reorderLists(orderedIds);
      } catch (err) {
        console.error('Failed to reorder lists via API:', err);
      }
    },
    [activeBoardId, update],
  );

  return {
    boards,
    activeBoard,
    activeBoardId,
    setActiveBoardId,
    switchBoard,
    loading,
    loadError,
    retryLoad,
    createBoard,
    updateBoardTitle,
    toggleBoardStar,
    deleteBoard,
    addList,
    updateListTitle,
    deleteList,
    copyList,
    sortList,
    addCard,
    updateCard,
    deleteCard,
    toggleCardComplete,
    moveCard,
    moveList,
  };
}
