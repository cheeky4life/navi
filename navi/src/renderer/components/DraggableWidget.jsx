import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';

// Grid configuration
const GRID_SIZE = 20; // 20px grid cells
const SNAP_TO_GRID = true; // Enable snap-to-grid

/**
 * Snap a coordinate to the nearest grid point
 */
function snapToGrid(value, gridSize = GRID_SIZE) {
    if (!SNAP_TO_GRID) return value;
    return Math.round(value / gridSize) * gridSize;
}

/**
 * DraggableWidget - A wrapper component that makes any child component draggable
 * Now with grid-based positioning for smooth, predictable dragging
 * @param {string} widgetId - Unique identifier for the widget
 * @param {React.ReactNode} children - The widget content to make draggable
 * @param {string} className - Additional CSS classes
 * @param {Object} defaultPosition - Default position { x, y } if not saved
 */
export default function DraggableWidget({ 
    widgetId, 
    children, 
    className = '',
    defaultPosition = { x: 50, y: 100 }
}) {
    const { activeWidgets, updateWidgetPosition } = useSettings();
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(defaultPosition);
    const widgetRef = useRef(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const positionRef = useRef(position);
    const rafIdRef = useRef(null);
    
    // Keep position ref in sync
    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    // Load saved position from settings
    useEffect(() => {
        const widget = activeWidgets.find(w => w.id === widgetId);
        if (widget) {
            // Snap loaded position to grid
            const snappedPos = {
                x: snapToGrid(widget.x),
                y: snapToGrid(widget.y)
            };
            setPosition(snappedPos);
        } else {
            // Snap default position to grid
            const snappedPos = {
                x: snapToGrid(defaultPosition.x),
                y: snapToGrid(defaultPosition.y)
            };
            setPosition(snappedPos);
        }
    }, [widgetId, activeWidgets, defaultPosition]);

    // Stable event handlers
    const handleMouseMove = useCallback((e) => {
        if (!isDraggingRef.current || !widgetRef.current) return;

        e.preventDefault();
        e.stopPropagation();

        // Cancel any pending animation frame
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
        }

        // Use requestAnimationFrame for smooth updates
        rafIdRef.current = requestAnimationFrame(() => {
            // Calculate new position based on mouse position minus the offset
            let newX = e.clientX - dragOffsetRef.current.x;
            let newY = e.clientY - dragOffsetRef.current.y;

            // Snap to grid
            newX = snapToGrid(newX);
            newY = snapToGrid(newY);

            // Constrain to viewport bounds
            const widgetWidth = widgetRef.current.offsetWidth || 320;
            const widgetHeight = widgetRef.current.offsetHeight || 400;
            const maxX = Math.max(0, window.innerWidth - widgetWidth);
            const maxY = Math.max(0, window.innerHeight - widgetHeight);

            // Ensure we stay within bounds and snap to grid
            const constrainedX = Math.max(0, Math.min(newX, snapToGrid(maxX)));
            const constrainedY = Math.max(0, Math.min(newY, snapToGrid(maxY)));

            // Update position immediately
            setPosition({ x: constrainedX, y: constrainedY });
        });
    }, []);

    const handleMouseUp = useCallback((e) => {
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            setIsDragging(false);
            
            // Clean up event listeners immediately
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp, { capture: true });
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
            
            // Get final position from ref (always current) and save
            const finalPos = positionRef.current;
            updateWidgetPosition(widgetId, finalPos.x, finalPos.y);
        }
    }, [widgetId, updateWidgetPosition, handleMouseMove]);

    // Handle mouse down - start dragging
    const handleMouseDown = useCallback((e) => {
        const target = e.target;
        
        // Don't drag if clicking on buttons or interactive elements
        if (target.closest('button') || 
            target.closest('input') || 
            target.closest('select') || 
            target.closest('a') ||
            target.closest('textarea') ||
            target.closest('[contenteditable]')) {
            return;
        }
        
        // Allow dragging from header area OR anywhere on the widget (except interactive elements)
        // Check if clicking on draggable header area OR if clicking on the widget itself
        const headerArea = target.closest('.cursor-grab');
        const isOnWidget = widgetRef.current && widgetRef.current.contains(target);
        
        // If not on header and not on widget, don't drag
        if (!headerArea && !isOnWidget) {
            return;
        }
        
        if (e.button !== 0) return; // Only left mouse button

        e.preventDefault();
        e.stopPropagation();

        // Get current widget position
        const rect = widgetRef.current.getBoundingClientRect();
        
        // Calculate offset from mouse to widget top-left corner
        dragOffsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };

        // Set dragging state
        isDraggingRef.current = true;
        setIsDragging(true);
        
        // CRITICAL: Attach event listeners IMMEDIATELY
        document.addEventListener('mousemove', handleMouseMove, { passive: false });
        document.addEventListener('mouseup', handleMouseUp, { capture: true });
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    }, [handleMouseMove, handleMouseUp]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
    }, [handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={widgetRef}
            className={`
                fixed z-40
                ${isDragging ? 'select-none' : ''}
                ${className}
            `}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: isDragging ? 'scale(1.02) translateZ(0)' : 'scale(1) translateZ(0)',
                transition: isDragging ? 'none' : 'transform 0.15s ease, box-shadow 0.15s ease',
                willChange: isDragging ? 'transform, left, top' : 'auto',
                pointerEvents: 'auto',
                boxShadow: isDragging 
                    ? '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(99, 102, 241, 0.2)' 
                    : '0 8px 16px rgba(0, 0, 0, 0.1)',
                touchAction: 'none',
                cursor: 'default', // Default cursor, but allow dragging
            }}
            onMouseDown={handleMouseDown}
            onDragStart={(e) => e.preventDefault()}
            draggable={false} // Prevent native HTML5 drag
        >
            {children}
        </div>
    );
}

/**
 * DragHandle - A component that can be used as a drag handle within a widget
 */
export function DragHandle({ children, onDragStart, className = '' }) {
    return (
        <div
            className={`cursor-grab active:cursor-grabbing ${className}`}
            onMouseDown={onDragStart}
        >
            {children}
        </div>
    );
}
