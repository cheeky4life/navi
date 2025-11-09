import React, { useState } from 'react';
import { GlassPanel, GlassButton, GlassCard } from '../GlassUI.jsx';

export default function QuickNotesWidget({ onClose }) {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');

    const addNote = () => {
        if (newNote.trim()) {
            setNotes(prev => [...prev, {
                id: Date.now(),
                text: newNote,
                createdAt: new Date().toISOString(),
            }]);
            setNewNote('');
        }
    };

    const removeNote = (id) => {
        setNotes(prev => prev.filter(note => note.id !== id));
    };

    return (
        <GlassPanel className="w-80 h-[400px] shadow-lg">
            <div className="flex justify-between items-center p-4 border-b border-white/20 cursor-grab active:cursor-grabbing">
                <h2 className="text-white/90 font-medium flex-1">Quick Notes</h2>
                {onClose && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <GlassButton
                            onClick={onClose}
                            className="w-8 h-8 p-0 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                            title="Close panel"
                        >
                            <span className="text-lg">×</span>
                        </GlassButton>
                    </div>
                )}
            </div>
            <div className="p-4 space-y-3 flex flex-col h-[calc(100%-73px)]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addNote()}
                        placeholder="Add a note..."
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <GlassButton
                        onClick={addNote}
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30"
                    >
                        Add
                    </GlassButton>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                    {notes.length === 0 ? (
                        <p className="text-white/40 text-sm text-center py-8">No notes yet</p>
                    ) : (
                        notes.map(note => (
                            <GlassCard key={note.id} className="p-3 group">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-white/90 text-sm flex-1">{note.text}</p>
                                    <button
                                        onClick={() => removeNote(note.id)}
                                        className="opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded p-1 transition-all text-white/60 hover:text-red-400"
                                    >
                                        ×
                                    </button>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            </div>
        </GlassPanel>
    );
}

