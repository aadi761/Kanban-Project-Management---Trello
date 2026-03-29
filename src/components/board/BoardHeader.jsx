import { useState, useEffect } from 'react';
import { Search, Star, Filter, Plus, Monitor, Sun, Moon, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { STATIC_MEMBERS, LABEL_COLORS } from '@/types/board.js';
import { useTheme } from '@/context/ThemeContext.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

export default function BoardHeader({
  board,
  boards,
  searchQuery,
  onSearchChange,
  filterLabels,
  filterMembers,
  filterDue,
  onToggleLabel,
  onToggleMember,
  onToggleDue,
  onSwitchBoard,
  onCreateBoard,
  onUpdateBoardTitle,
  onToggleBoardStar,
  onDeleteBoard,
}) {
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(board.title);
  const { themeMode, setThemeMode } = useTheme();

  // Keep edit title in sync if board changes externally
  useEffect(() => {
    setEditTitleValue(board.title);
  }, [board.title, board.id]);

  const handleTitleSubmit = () => {
    if (editTitleValue.trim() && editTitleValue.trim() !== board.title) {
      onUpdateBoardTitle(editTitleValue.trim());
    } else {
      setEditTitleValue(board.title); // reset on empty
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 overflow-x-auto px-4 py-2 bg-background/60 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-background/50 hover:bg-secondary border-border/50 shadow-sm font-semibold">
              Boards <span className="ml-1 text-muted-foreground text-[10px]">▼</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch Board</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {boards.map((b) => (
              <DropdownMenuCheckboxItem
                key={b.id}
                checked={b.id === board.id}
                onCheckedChange={() => onSwitchBoard(b.id)}
              >
                {b.title}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            {showNewBoard ? (
              <div className="px-2 py-1 flex gap-1">
                <Input
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  placeholder="Board name"
                  className="h-7 text-sm"
                  autoFocus
                  onBlur={() => setShowNewBoard(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newBoardTitle.trim()) {
                      onCreateBoard(newBoardTitle.trim());
                      setNewBoardTitle('');
                      setShowNewBoard(false);
                    }
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowNewBoard(true); }}
                className="w-full px-2 py-1.5 text-sm text-left flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-4 h-4" /> New board
              </button>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-border/50 mx-1" />

        {isEditingTitle ? (
          <Input
            value={editTitleValue}
            onChange={(e) => setEditTitleValue(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setEditTitleValue(board.title);
                setIsEditingTitle(false);
              }
            }}
            autoFocus
            className="h-8 text-lg font-bold bg-background text-foreground w-auto min-w-[120px] px-2 py-1"
            style={{ width: `${Math.max(editTitleValue.length + 2, 8)}ch` }}
          />
        ) : (
          <Button 
            variant="ghost" 
            className="text-lg font-bold text-foreground hover:bg-secondary/80 px-2"
            onClick={() => setIsEditingTitle(true)}
          >
            {board.title}
          </Button>
        )}
        
        <button
          onClick={onToggleBoardStar}
          className={`p-1.5 rounded hover:bg-secondary/80 transition-colors ${board.isStarred ? 'text-yellow-400 hover:text-yellow-500' : 'text-muted-foreground hover:text-foreground'}`}
          title={board.isStarred ? "Unstar board" : "Star board"}
        >
          <Star className={`w-4 h-4 ${board.isStarred ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={onDeleteBoard}
          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete board"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search cards..."
            className="pl-9 h-8 w-52 bg-secondary border-none text-sm"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Filter className="w-4 h-4" /> Filter
              {(filterLabels.length > 0 || filterMembers.length > 0 || filterDue) && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Labels</DropdownMenuLabel>
            {LABEL_COLORS.map((l) => (
              <DropdownMenuCheckboxItem
                key={l.color}
                checked={filterLabels.includes(l.color)}
                onCheckedChange={() => onToggleLabel(l.color)}
              >
                <span className={`w-3 h-3 rounded-sm mr-2 bg-label-${l.color}`} />
                {l.name}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Members</DropdownMenuLabel>
            {STATIC_MEMBERS.map((m) => (
              <DropdownMenuCheckboxItem
                key={m.id}
                checked={filterMembers.includes(m.id)}
                onCheckedChange={() => onToggleMember(m.id)}
              >
                {m.name}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={filterDue} onCheckedChange={onToggleDue}>
              Has due date
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Theme">
              {themeMode === 'dark' ? (
                <Moon className="w-4 h-4" />
              ) : themeMode === 'light' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Monitor className="w-4 h-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={themeMode} onValueChange={setThemeMode}>
              <DropdownMenuRadioItem value="system" className="gap-2">
                <Monitor className="w-4 h-4" /> System
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="light" className="gap-2">
                <Sun className="w-4 h-4" /> Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" className="gap-2">
                <Moon className="w-4 h-4" /> Dark
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex -space-x-2 ml-2">
          {STATIC_MEMBERS.map((m) => (
            <div
              key={m.id}
              className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground ring-2 ring-background"
            >
              {m.initials}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
