import { useState, useMemo } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Plus, X } from 'lucide-react';
import { useBoardStore } from '@/store/boardStore.js';
import BoardList from './BoardList.jsx';
import BoardHeader from './BoardHeader.jsx';
import CardDetailModal from './CardDetailModal.jsx';
import BoardSwitcher from './BoardSwitcher.jsx';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function KanbanBoard() {
  const store = useBoardStore();
  const { activeBoard, boards } = store;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabels, setFilterLabels] = useState([]);
  const [filterMembers, setFilterMembers] = useState([]);
  const [filterDue, setFilterDue] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    if (type === 'LIST') {
      store.moveList(source.index, destination.index);
      return;
    }

    store.moveCard(source.droppableId, destination.droppableId, source.index, destination.index);
  };

  const filteredCardIds = useMemo(() => {
    if (!activeBoard) return new Set();
    const ids = new Set();
    Object.values(activeBoard.cards).forEach(card => {
      if (card.archived) return;
      if (searchQuery && !card.title.toLowerCase().includes(searchQuery.toLowerCase())) return;
      if (filterLabels.length > 0 && !card.labels.some(l => filterLabels.includes(l.color))) return;
      if (filterMembers.length > 0 && !card.memberIds.some((id) => filterMembers.includes(Number(id)))) return;
      if (filterDue && !card.dueDate) return;
      ids.add(card.id);
    });
    return ids;
  }, [activeBoard, searchQuery, filterLabels, filterMembers, filterDue]);

  const hasFilters = searchQuery || filterLabels.length > 0 || filterMembers.length > 0 || filterDue;

  if (store.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Loading boards…
      </div>
    );
  }

  if (store.loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center max-w-lg mx-auto">
        <p className="font-medium text-destructive">Could not load boards from the server</p>
        <p className="text-sm text-muted-foreground">{store.loadError}</p>
        <p className="text-xs text-muted-foreground">
          If the deployed site uses HTTPS, <code className="rounded bg-muted px-1 py-0.5">VITE_API_URL</code> must
          also be <strong>https</strong> (your Render API URL). Match{' '}
          <code className="rounded bg-muted px-1 py-0.5">FRONTEND_URL</code> on Render to this site’s origin for CORS.
        </p>
        <Button type="button" onClick={() => store.retryLoad()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!activeBoard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-muted-foreground text-sm">No boards yet. Create one or run backend/seed_demo.sql on Neon.</p>
        <Button onClick={() => store.createBoard('My Board')}>Create your first board</Button>
      </div>
    );
  }

  const selectedCard = selectedCardId ? activeBoard.cards[selectedCardId] : null;

  return (
    <div className="h-screen flex flex-col">
      <BoardHeader
        board={activeBoard}
        boards={boards}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterLabels={filterLabels}
        filterMembers={filterMembers}
        filterDue={filterDue}
        onToggleLabel={c => setFilterLabels(prev => prev.includes(c) ? prev.filter(l => l !== c) : [...prev, c])}
        onToggleMember={id => setFilterMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])}
        onToggleDue={() => setFilterDue(prev => !prev)}
        onSwitchBoard={store.switchBoard}
        onCreateBoard={store.createBoard}
        onUpdateBoardTitle={store.updateBoardTitle}
        onToggleBoardStar={store.toggleBoardStar}
        onDeleteBoard={() => store.deleteBoard(activeBoard.id)}
      />

      <div className="flex-1 board-gradient overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="LIST">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-3 p-4 items-start h-full"
              >
                {activeBoard.lists.map((list, index) => {
                  const cards = list.cardIds
                    .map(id => activeBoard.cards[id])
                    .filter(c => c && !c.archived && (!hasFilters || filteredCardIds.has(c.id)));

                  return (
                    <BoardList
                      key={list.id}
                      list={list}
                      cards={cards}
                      index={index}
                      onAddCard={title => store.addCard(list.id, title)}
                      onCardClick={setSelectedCardId}
                      onToggleCardComplete={store.toggleCardComplete}
                      onUpdateTitle={title => store.updateListTitle(list.id, title)}
                      onDelete={() => store.deleteList(list.id)}
                      onCopy={(newTitle) => store.copyList(list.id, newTitle)}
                      onSort={(sortBy) => store.sortList(list.id, sortBy)}
                      onMove={(destIndex) => store.moveList(index, destIndex)}
                    />
                  );
                })}
                {provided.placeholder}

                <div className="w-72 flex-shrink-0">
                  {addingList ? (
                    <div className="bg-list rounded-xl p-2">
                      <Input
                        value={newListTitle}
                        onChange={e => setNewListTitle(e.target.value)}
                        placeholder="Enter list title..."
                        className="text-sm bg-secondary border-none mb-1"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newListTitle.trim()) {
                            store.addList(newListTitle.trim());
                            setNewListTitle('');
                          }
                          if (e.key === 'Escape') setAddingList(false);
                        }}
                      />
                      <div className="flex items-center gap-1">
                        <Button size="sm" onClick={() => {
                          if (newListTitle.trim()) {
                            store.addList(newListTitle.trim());
                            setNewListTitle('');
                          }
                        }} className="h-7 text-xs">Add list</Button>
                        <button onClick={() => setAddingList(false)} className="p-1"><X className="w-4 h-4 text-muted-foreground" /></button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingList(true)}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-foreground/80 text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add another list
                    </button>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          open={!!selectedCard}
          onClose={() => setSelectedCardId(null)}
          onUpdate={updates => store.updateCard(selectedCard.id, updates)}
          onDelete={() => { store.deleteCard(selectedCard.id); setSelectedCardId(null); }}
        />
      )}

      <BoardSwitcher 
        boards={boards} 
        activeBoardId={activeBoard.id} 
        onSwitchBoard={store.switchBoard} 
        onCreateBoard={store.createBoard} 
      />
    </div>
  );
}
