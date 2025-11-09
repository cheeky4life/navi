import React from 'react';
import { GlassPanel, GlassButton, GlassCard } from '../GlassUI.jsx';
import { getFileIcon, formatFileSize, getRelativeTime } from '../../utils/documentUtils';

export default function DocumentUploadWidget({ 
    documents, 
    selectedDocument, 
    onAddDocument, 
    onRemoveDocument, 
    onSelectDocument,
    onClose 
}) {
    return (
        <GlassPanel className="w-80 h-[400px] shadow-lg">
            <div className="flex justify-between items-center p-4 border-b border-white/20 cursor-grab active:cursor-grabbing">
                <h2 className="text-white/90 font-medium flex-1">Documents</h2>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <GlassButton
                        onClick={onAddDocument}
                        className="w-8 h-8 p-0 flex items-center justify-center hover:bg-green-500/20 transition-colors"
                        title="Add document"
                    >
                        <span className="text-lg">+</span>
                    </GlassButton>
                    {onClose && (
                        <GlassButton
                            onClick={onClose}
                            className="w-8 h-8 p-0 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                            title="Close panel"
                        >
                            <span className="text-lg">×</span>
                        </GlassButton>
                    )}
                </div>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto max-h-[332px]">
                {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="text-4xl mb-2">📁</div>
                        <p className="text-white/60 text-sm mb-2">No documents yet</p>
                        <p className="text-white/40 text-xs">Click + to add a document</p>
                    </div>
                ) : (
                    documents.map((doc) => (
                        <div key={doc.id} className="group">
                            <GlassCard
                                className={`cursor-pointer transition-all hover:bg-white/15 ${
                                    selectedDocument?.id === doc.id ? 'ring-2 ring-blue-500/50 bg-white/10' : ''
                                }`}
                                onClick={() => onSelectDocument(doc)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl flex-shrink-0">{getFileIcon(doc.name)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white/90 text-sm font-medium truncate" title={doc.name}>
                                            {doc.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-white/60 text-xs">
                                                {getRelativeTime(new Date(doc.addedAt))}
                                            </p>
                                            {doc.size > 0 && (
                                                <>
                                                    <span className="text-white/40">•</span>
                                                    <p className="text-white/60 text-xs">
                                                        {formatFileSize(doc.size)}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveDocument(doc.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded p-1 transition-all text-white/60 hover:text-red-400 flex-shrink-0 w-6 h-6 flex items-center justify-center"
                                        title="Remove document"
                                    >
                                        <span className="text-lg leading-none">×</span>
                                    </button>
                                </div>
                            </GlassCard>
                        </div>
                    ))
                )}
            </div>
        </GlassPanel>
    );
}

