import { useState, useRef } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { MoreHorizontal, Plus, X } from 'lucide-react';
import BoardCard from './BoardCard.jsx';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import CopyListModal from '@/components/ui/CopyListModal.jsx';

export default function BoardList({ list, cards, index, onAddCard, onCardClick, onToggleCardComplete, onUpdateTitle, onDelete, onCopy, onSort, onMove }) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(list.title);
  const [showModal, setShowModal] = useState(false);
  
  // Custom move list state
  const [moving, setMoving] = useState(false);
  const [movePos, setMovePos] = useState(index + 1);

  const handleMove = () => {
    const pos = parseInt(movePos, 10);
    if (!isNaN(pos) && pos > 0) {
      onMove(pos - 1);
    }
    setMoving(false);
  };

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAddCard(newTitle.trim());
      setNewTitle('');
    }
  };

  return (
    <Draggable draggableId={`list-${list.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`w-72 flex-shrink-0 transition-opacity ${snapshot.isDragging ? 'opacity-[0.68] shadow-2xl ring-2 ring-primary/25 backdrop-blur-[0.5px]' : ''}`}
        >
          <div className="bg-list rounded-xl p-2 max-h-[calc(100vh-140px)] flex flex-col">
            <div {...provided.dragHandleProps} className="flex items-center justify-between px-2 py-1.5">
              {editing ? (
                <Input
                  value={editTitleValue}
                  onChange={e => setEditTitleValue(e.target.value)}
                  onBlur={() => { onUpdateTitle(editTitleValue); setEditing(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') { onUpdateTitle(editTitleValue); setEditing(false); } }}
                  className="h-7 text-sm font-semibold bg-secondary border-none"
                  autoFocus
                />
              ) : (
                <h3
                  onClick={() => setEditing(true)}
                  className="text-sm font-semibold text-list-header cursor-pointer"
                >
                  {list.title}
                </h3>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded hover:bg-secondary">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem onClick={() => setShowModal(true)}>Copy List</DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Sort Cards By...</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => onSort('newest')}>Date Created (Newest First)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSort('oldest')}>Date Created (Oldest First)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSort('dueDate')}>Due Date</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setMoving(true)}>Move List</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:bg-destructive/10">
                    Delete list
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Droppable droppableId={list.id} type="CARD">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 overflow-y-auto scrollbar-thin space-y-1.5 min-h-[4px] px-1 py-0.5 rounded-lg transition-colors
                    ${snapshot.isDraggingOver ? 'bg-secondary/50' : ''}
                  `}
                >
                  {cards.map((card, i) => (
                    <BoardCard
                      key={card.id}
                      card={card}
                      index={i}
                      onClick={() => onCardClick(card.id)}
                      onToggleComplete={() => onToggleCardComplete(card.id)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {adding ? (
              <div className="px-1 pt-1.5">
                <Textarea
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Enter a title for this card..."
                  className="text-[14px] font-medium bg-white dark:bg-[#22272B] border-none shadow-sm resize-none min-h-[56px] py-2 px-3 mb-2 focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-[#85B8FF] text-foreground dark:text-[#B6C2CF] placeholder:text-muted-foreground dark:placeholder:text-[#8C9BAB]"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      handleAdd();
                      setTimeout(() => e.target?.focus(), 10);
                    }
                    if (e.key === 'Escape') setAdding(false);
                  }}
                />
                <div className="flex items-center gap-1">
                  <Button size="sm" onClick={handleAdd} className="h-7 text-xs">Add card</Button>
                  <button onClick={() => setAdding(false)} className="p-1"><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              </div>
            ) : moving ? (
              <div className="px-1 pt-1.5 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Move to:</span>
                  <Input
                    type="number"
                    min="1"
                    value={movePos}
                    onChange={e => setMovePos(e.target.value)}
                    className="h-7 w-16 text-xs"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleMove(); if (e.key === 'Escape') setMoving(false); }}
                  />
                  <Button size="sm" onClick={handleMove} className="h-7 text-xs">Go</Button>
                  <button onClick={() => setMoving(false)} className="p-1 ml-auto"><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 px-3 py-2 mt-1 text-[14px] font-medium text-muted-foreground hover:bg-black/5 hover:text-foreground dark:text-[#8C9BAB] dark:hover:bg-[#A6C5E2]/20 dark:hover:text-[#B6C2CF] rounded-lg transition-colors w-full text-left group"
              >
                <Plus className="w-[18px] h-[18px]" />
                <span>Add a card</span>
                <div className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-template"><rect width="18" height="7" x="3" y="3" rx="1"/><rect width="9" height="7" x="3" y="14" rx="1"/><rect width="5" height="7" x="16" y="14" rx="1"/></svg>
                </div>
              </button>
            )}
          </div>
          <CopyListModal
            isOpen={showModal}
            defaultValue={list.title}
            onClose={() => setShowModal(false)}
            onSubmit={(newTitle) => {
              setShowModal(false);
              onCopy(newTitle);
            }}
          />
        </div>
      )}
    </Draggable>
  );
}
