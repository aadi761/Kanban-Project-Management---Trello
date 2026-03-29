import { useState } from 'react';
import { Star, LayoutGrid, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function BoardSwitcher({ boards, activeBoardId, onSwitchBoard, onCreateBoard }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const starredBoards = boards.filter(b => b.isStarred);
  const otherBoards = boards.filter(b => !b.isStarred);

  const handleSwitch = (id) => {
    onSwitchBoard(id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1D2125]/95 hover:bg-[#282E33] border border-[#3A444C] text-[#B6C2CF] flex items-center gap-2 px-6 py-3 rounded-full text-base font-bold shadow-2xl transition-all hover:scale-105 backdrop-blur-md">
          <LayoutGrid className="w-5 h-5 text-primary" />
          Switch boards
        </button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl w-[90vw] p-8 bg-[#22272B] border-[#3A444C] shadow-2xl rounded-2xl gap-8">
        
        {/* Starred Boards */}
        {starredBoards.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4 text-[#B6C2CF]">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <h2 className="text-lg font-bold">Starred Boards</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {starredBoards.map((board, i) => (
                <button 
                  key={board.id} 
                  onClick={() => handleSwitch(board.id)}
                  className="h-28 rounded-xl overflow-hidden relative group text-left ring-offset-background hover:ring-2 ring-primary/50 transition-all focus:outline-none shadow-md"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${i % 2 === 0 ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-indigo-600'} opacity-90 group-hover:opacity-100 transition-opacity`} />
                  <Star className="absolute top-2.5 right-2.5 w-5 h-5 text-white fill-white drop-shadow-md" />
                  <div className="absolute inset-x-0 bottom-0 bg-[#1D2125]/90 p-3 pt-6 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-base font-bold text-white truncate drop-shadow">{board.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Your Boards */}
        <div>
          <div className="flex items-center gap-2 mb-4 text-[#B6C2CF]">
            <LayoutGrid className="w-5 h-5" />
            <h2 className="text-lg font-bold">Your boards</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {otherBoards.map((board, i) => (
              <button 
                key={board.id} 
                onClick={() => handleSwitch(board.id)}
                className="h-28 rounded-xl overflow-hidden relative group text-left shadow-md ring-offset-background hover:ring-2 ring-primary/50 transition-all focus:outline-none"
              >
                <div className={`absolute inset-0 ${i % 3 === 0 ? 'bg-[#1C2B41]' : i % 3 === 1 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-[#1D2125] border border-[#3A444C]'} opacity-90 group-hover:opacity-100 transition-opacity`} />
                <div className="absolute inset-x-0 bottom-0 p-3 pt-6 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-base font-bold text-[#B6C2CF] truncate group-hover:text-white transition-colors">{board.title}</p>
                </div>
              </button>
            ))}
            
            <button 
              onClick={() => {
                 onCreateBoard('New Board');
                 setOpen(false);
              }}
              className="h-28 rounded-xl bg-[#282E33]/50 hover:bg-[#333C43] transition-colors border-2 border-dashed border-[#3A444C] flex flex-col items-center justify-center p-3 text-center focus:outline-none group gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-[#B6C2CF] font-medium leading-snug group-hover:text-white transition-colors">Create new board</span>
            </button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
