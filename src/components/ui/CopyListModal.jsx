import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function CopyListModal({ isOpen, onClose, onSubmit, defaultValue }) {
  const [value, setValue] = useState(defaultValue || '');

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue || '');
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const finalValue = value.trim() || defaultValue;
    onSubmit(finalValue);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-background border border-border shadow-xl rounded-xl w-full max-w-sm p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-foreground">Copy List</h3>
        <Input 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter list name..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') onClose();
          }}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Copy</Button>
        </div>
      </div>
    </div>
  );
}
