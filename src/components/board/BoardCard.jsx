import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { CheckSquare, Clock, Pencil, AlignLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { STATIC_MEMBERS } from '@/types/board.js';

const LABEL_BG = {
  green: 'bg-label-green',
  yellow: 'bg-label-yellow',
  orange: 'bg-label-orange',
  red: 'bg-label-red',
  purple: 'bg-label-purple',
  blue: 'bg-label-blue',
};

function memberAssigned(cardIds, memberId) {
  return (cardIds || []).some((id) => Number(id) === Number(memberId));
}

export default function BoardCard({ card, index, onClick, onToggleComplete }) {
  const completedCount = card.checklist.filter((i) => i.completed).length;
  const members = STATIC_MEMBERS.filter((m) => memberAssigned(card.memberIds, m.id));
  const [justCompleted, setJustCompleted] = useState(false);

  const handleToggle = () => {
    if (!card.completed) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    onToggleComplete?.();
  };

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`group relative rounded-lg px-3 py-2 cursor-pointer transition-all border border-border shadow-sm
            ${snapshot.isDragging ? 'bg-white dark:bg-secondary/40 shadow-xl opacity-90 ring-1 ring-primary/30' : 'bg-white dark:bg-[#22272B] hover:bg-gray-50 dark:hover:bg-[#282E33]'}
            ${card.completed ? 'opacity-80' : ''}
          `}
        >
          <div className="flex gap-3 items-start">
            <div
              className="relative pt-0.5 shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`absolute top-0.5 left-0 w-5 h-5 rounded-full pointer-events-none ${justCompleted ? 'animate-spark z-10' : ''}`} />
              <Checkbox
                checked={Boolean(card.completed)}
                onCheckedChange={handleToggle}
                className="relative z-0 w-5 h-5 rounded-full border-muted-foreground/50 data-[state=checked]:bg-[#1f845a] data-[state=checked]:border-[#1f845a] data-[state=checked]:text-white transition-colors"
              />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              {card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {card.labels.map((l) => (
                    <span key={l.id} className={`${LABEL_BG[l.color]} h-2 w-10 rounded-full`} />
                  ))}
                </div>
              )}

              <p className={`text-[15px] font-medium leading-snug tracking-tight pb-1 ${card.completed ? 'text-muted-foreground dark:text-[#8C9BAB]' : 'text-foreground dark:text-[#B6C2CF]'}`}>
                {card.title}
              </p>

              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                {card.description && (
                  <AlignLeft className="w-3.5 h-3.5 text-muted-foreground dark:text-[#8C9BAB]" />
                )}
                {card.dueDate && (
                  <span className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3 shrink-0" />
                    {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
                {card.checklist.length > 0 && (
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      completedCount === card.checklist.length ? 'text-label-green' : ''
                    }`}
                  >
                    <CheckSquare className="w-3 h-3 shrink-0" />
                    {completedCount}/{card.checklist.length}
                  </span>
                )}
                <div className="ml-auto flex -space-x-1">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground ring-1 ring-card"
                    >
                      {m.initials}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </Draggable>
  );
}
