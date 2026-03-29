import { useState, useEffect, useRef } from 'react';
import { X, Tag, Calendar, CheckSquare, Users, Trash2, AlignLeft, Save, Plus, MessageSquare } from 'lucide-react';
import { STATIC_MEMBERS, LABEL_COLORS } from '@/types/board.js';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Bold, Italic, Type, List as ListIcon, Link as LinkIcon, Image as ImageIcon, Plus as PlusIcon, HelpCircle, MoreHorizontal, Smile, AtSign } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { v4 as uuidv4 } from 'uuid';

const LABEL_BG = {
  green: 'bg-label-green',
  yellow: 'bg-label-yellow',
  orange: 'bg-label-orange',
  red: 'bg-label-red',
  purple: 'bg-label-purple',
  blue: 'bg-label-blue',
};

function memberIdsMatch(cardIds, memberId) {
  return (cardIds || []).some((id) => Number(id) === Number(memberId));
}

export default function CardDetailModal({ card, open, onClose, onUpdate, onDelete }) {
  const [draft, setDraft] = useState(card);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  
  // Single open state tracker for popovers ensures only one is open
  const [openPopover, setOpenPopover] = useState(null);

  useEffect(() => {
    setDraft(card);
    setIsEditingDesc(false);
  }, [card]);

  const updateDraft = (updates) => setDraft((prev) => ({ ...prev, ...updates }));

  const handleSave = () => {
    onUpdate(draft);
    onClose();
  };

  const toggleLabel = (id, color, name) => {
    const exists = draft.labels.find((l) => l.color === color);
    if (exists) {
      updateDraft({ labels: draft.labels.filter((l) => l.color !== color) });
    } else {
      updateDraft({ labels: [...draft.labels, { id, text: name, color }] });
    }
  };

  const toggleMember = (memberId) => {
    const ids = draft.memberIds || [];
    if (memberIdsMatch(ids, memberId)) {
      updateDraft({ memberIds: ids.filter((id) => Number(id) !== Number(memberId)) });
    } else {
      updateDraft({ memberIds: [...ids, Number(memberId)] });
    }
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    updateDraft({
      checklist: [...draft.checklist, { id: uuidv4(), text: newCheckItem.trim(), completed: false }],
    });
    setNewCheckItem('');
    setOpenPopover(null);
  };

  const toggleCheckItem = (itemId) => {
    const next = draft.checklist.map((i) => (i.id === itemId ? { ...i, completed: !i.completed } : i));
    const prevItem = draft.checklist.find((i) => i.id === itemId);
    const newItem = next.find((i) => i.id === itemId);
    let activity = [...(draft.activity || [])];
    if (prevItem && !prevItem.completed && newItem?.completed) {
      activity.push('Checklist item completed');
    }
    updateDraft({ checklist: next, activity });
  };

  const removeCheckItem = (itemId) => {
    updateDraft({ checklist: draft.checklist.filter((i) => i.id !== itemId) });
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const activity = [...(draft.activity || [])];
    activity.push(`commented: ${newComment.trim()}`);
    updateDraft({ activity });
    setNewComment('');
  };

  const handleFormat = (format) => {
    const text = draft.description || '';
    const before = text.substring(0, selection.start);
    const selected = text.substring(selection.start, selection.end);
    const after = text.substring(selection.end);
    let newText = '';
    if (format === 'bold') newText = `${before}**${selected || 'bold'}**${after}`;
    if (format === 'italic') newText = `${before}*${selected || 'italic'}*${after}`;
    updateDraft({ description: newText });
  };

  const completedCount = draft.checklist.filter((i) => i.completed).length;
  const progress = draft.checklist.length > 0 ? (completedCount / draft.checklist.length) * 100 : 0;
  const activity = draft.activity || [];

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-[min(95vw,60rem)] w-full max-h-[90vh] overflow-hidden flex flex-col bg-popover border-border p-0 gap-0">
        <div className="p-4 sm:p-6 pt-10 flex-1 min-h-0 overflow-y-auto md:overflow-hidden flex flex-col">
          <div className="flex flex-col md:flex-row gap-6 h-auto md:h-full min-h-0">
            {/* LEFT COLUMN: Main Card Details */}
            <div className="flex-1 flex flex-col min-w-0 md:pr-4 md:overflow-y-auto scrollbar-thin">
              <div className="flex items-center gap-2 mb-4">
                <Textarea
                  value={draft.title}
                  onChange={(e) => updateDraft({ title: e.target.value })}
                  rows={1}
                  className={`text-3xl font-black h-auto min-h-[38px] px-1 py-0 m-0 overflow-hidden resize-none bg-transparent border-none focus-visible:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-[#85B8FF] text-foreground shadow-none leading-none ${draft.completed ? 'line-through opacity-75' : ''
                    }`}
                />
              </div>

              {/* ACTION BUTTON ROW */}
              <div className="flex flex-wrap items-center gap-2 pl-7 mb-8">

                {/* Labels Popover */}
                <Popover open={openPopover === 'labels'} onOpenChange={(open) => setOpenPopover(open ? 'labels' : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="sm" className="gap-1.5 font-medium rounded-md h-8 px-3">
                      <Tag className="w-3.5 h-3.5" /> Labels
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-3 z-50">
                    <p className="text-sm font-semibold text-foreground mb-3 text-center">Labels</p>
                    <div className="mb-2">
                      <Input placeholder="Search labels..." className="h-8 text-sm" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 mt-4">Labels</p>
                    <div className="space-y-1">
                      {LABEL_COLORS.map((l) => (
                        <div key={l.color} className="flex items-center gap-2">
                          <Checkbox
                            checked={!!draft.labels.find((cl) => cl.color === l.color)}
                            onCheckedChange={() => toggleLabel(l.id, l.color, l.name)}
                            className="shrink-0"
                          />
                          <button
                            type="button"
                            onClick={() => toggleLabel(l.id, l.color, l.name)}
                            className={`flex-1 h-8 rounded-md flex items-center px-3 hover:opacity-90 transition-opacity ${LABEL_BG[l.color]}`}
                          >
                          </button>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Dates Popover */}
                <Popover open={openPopover === 'date'} onOpenChange={(open) => setOpenPopover(open ? 'date' : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="sm" className="gap-1.5 font-medium rounded-md h-8 px-3">
                      <Calendar className="w-3.5 h-3.5" /> Dates
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-3 z-50">
                    <p className="text-sm font-semibold text-foreground mb-3 text-center">Dates</p>
                    <Input
                      type="date"
                      value={draft.dueDate || ''}
                      onChange={(e) => updateDraft({ dueDate: e.target.value || null })}
                      className="bg-secondary text-sm"
                    />
                    <div className="flex gap-1 mt-2">
                      {draft.dueDate && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs w-full"
                          onClick={() => {
                            updateDraft({ dueDate: null });
                            setOpenPopover(null);
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Checklist Popover */}
                <Popover open={openPopover === 'checklist'} onOpenChange={(open) => setOpenPopover(open ? 'checklist' : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="sm" className="gap-1.5 font-medium rounded-md h-8 px-3">
                      <CheckSquare className="w-3.5 h-3.5" /> Checklist
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-3 z-50">
                    <p className="text-sm font-semibold text-foreground mb-3 text-center">Add Checklist</p>
                    <Input
                      value={newCheckItem}
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      placeholder="Add an item..."
                      className="text-sm bg-secondary h-8 mb-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addCheckItem();
                      }}
                    />
                    <Button size="sm" className="w-full" onClick={addCheckItem}>
                      Add
                    </Button>
                  </PopoverContent>
                </Popover>

                {/* Members Popover */}
                <Popover open={openPopover === 'members'} onOpenChange={(open) => setOpenPopover(open ? 'members' : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="sm" className="gap-1.5 font-medium rounded-md h-8 px-3">
                      <Users className="w-3.5 h-3.5" /> Members
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-3 z-50">
                    <p className="text-sm font-semibold text-foreground mb-3 text-center">Members</p>
                    {STATIC_MEMBERS.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => toggleMember(m.id)}
                        className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-secondary text-sm"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground shrink-0">
                          {m.initials}
                        </div>
                        <span className="text-foreground text-left flex-1">{m.name}</span>
                        {memberIdsMatch(draft.memberIds, m.id) && <span className="ml-auto text-primary">✓</span>}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>

              {/* DISPLAY APPLIED TAGS/MEMBERS/DUE DATE */}
              {(draft.labels.length > 0 || (draft.memberIds && draft.memberIds.length > 0) || draft.dueDate) && (
                <div className="pl-7 flex flex-wrap gap-4 mb-6">
                  {draft.labels.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Labels</p>
                      <div className="flex flex-wrap gap-1.5">
                        {draft.labels.map((l) => (
                          <span
                            key={l.id}
                            className={`${LABEL_BG[l.color]} text-xs font-medium px-3 py-1 rounded text-primary-foreground`}
                          ></span>
                        ))}
                      </div>
                    </div>
                  )}

                  {draft.memberIds && draft.memberIds.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Members</p>
                      <div className="flex flex-wrap gap-1">
                        {STATIC_MEMBERS.filter((m) => memberIdsMatch(draft.memberIds, m.id)).map((m) => (
                          <div
                            key={m.id}
                            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground"
                            title={m.name}
                          >
                            {m.initials}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {draft.dueDate && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Due date</p>
                      <span className="text-sm text-foreground bg-secondary px-2 py-1 rounded inline-block">
                        {new Date(draft.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-8 pl-1">
                <div className="flex items-center gap-4 mb-3">
                  <AlignLeft className="w-5 h-5 text-[#B6C2CF] shrink-0" />
                  <h4 className="text-base font-bold text-[#B6C2CF]">Description</h4>
                </div>
                <div className="pl-9">
                  {isEditingDesc ? (
                    <div>
                      <div className="border border-[#85B8FF] rounded-lg overflow-hidden flex flex-col transition-all bg-[#22272B] ring-1 ring-[#85B8FF] focus-within:ring-2 shadow-sm mb-3">
                        {/* Text Area */}
                        <Textarea
                          value={draft.description}
                          onChange={(e) => updateDraft({ description: e.target.value })}
                          onSelect={(e) => setSelection({ start: e.target.selectionStart, end: e.target.selectionEnd })}
                          placeholder="Add a more detailed description..."
                          className="bg-transparent border-none text-[#B6C2CF] font-medium min-h-[140px] shadow-none rounded-none focus-visible:ring-0 leading-relaxed p-4 py-3 placeholder:text-[#8C9BAB] resize-y"
                          autoFocus
                        />
                      </div>
                      
                      {/* Editor Footer Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => setIsEditingDesc(false)} className="bg-[#579DFF] hover:bg-[#85B8FF] text-[#1D2125] font-semibold h-8 px-4">
                            Save
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setIsEditingDesc(false)} className="h-8 px-3 text-[#B6C2CF] hover:text-white hover:bg-[#282E33] font-medium">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setIsEditingDesc(true)}
                      className="text-[#B6C2CF] font-medium text-[15px] min-h-[60px] bg-[#22272B] hover:bg-[#282E33] transition-colors py-3 px-4 rounded-md cursor-pointer outline-none focus:ring-2 focus:ring-[#85B8FF] leading-relaxed whitespace-pre-wrap"
                      tabIndex={0}
                    >
                      {draft.description ? draft.description : 'Add a more detailed description...'}
                    </div>
                  )}
                </div>
              </div>

              {/* Checklist Section */}
              {draft.checklist.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-foreground shrink-0" />
                      <h4 className="text-base font-semibold text-foreground">Checklist</h4>
                    </div>
                    <Button variant="secondary" size="sm" className="h-8" onClick={() => updateDraft({ checklist: [] })}>Delete</Button>
                  </div>
                  <div className="pl-7">
                    <div className="flex items-center gap-2 mb-4 text-xs font-medium text-muted-foreground">
                      <span className="w-8 text-right">{Math.round(progress)}%</span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 ease-in-out rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {draft.checklist.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 group px-2 py-1 -mx-2 rounded hover:bg-secondary/40 transition-colors">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleCheckItem(item.id)}
                            className="mt-1"
                          />
                          <span
                            className={`text-sm flex-1 pt-0.5 ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}
                      <Button variant="secondary" size="sm" className="mt-2" onClick={() => setOpenPopover('checklist')}>Add an item</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Comments and Activity */}
            <div className="w-full md:w-[340px] flex flex-col pt-2 bg-background/50 rounded-lg p-4 h-auto md:h-full shrink-0 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-foreground" />
                  <h4 className="text-base font-semibold text-foreground">Comments and activity</h4>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground shrink-0 mt-1">
                  AS
                </div>
                <div className="flex-1">
                  <Input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addComment(); }}
                    placeholder="Write a comment..."
                    className="bg-secondary/80 border-none placeholder:text-muted-foreground"
                  />
                  {newComment.trim() && (
                    <Button size="sm" onClick={addComment} className="mt-2 h-7 text-xs">Save</Button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {[...activity].reverse().map((line, i) => (
                      <li key={`${line}-${i}`} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground shrink-0">
                          AS
                        </div>
                        <div className="flex-1 text-sm text-foreground pt-1.5 leading-snug">
                          <span className="font-semibold mr-1">Aaditya Sehrawat</span>
                          {line.replace('Card created', 'added this card')}
                          <div className="text-xs text-muted-foreground mt-1 hover:underline cursor-pointer">
                            Just now
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 justify-between items-center bg-muted/30 -mx-4 sm:-mx-6 -mb-6 p-4 border-t border-border">
            <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1.5 font-semibold text-xs h-8">
              <Trash2 className="w-3.5 h-3.5" /> Delete Card
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleSave} className="gap-1.5 px-6 font-semibold shadow-sm">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
