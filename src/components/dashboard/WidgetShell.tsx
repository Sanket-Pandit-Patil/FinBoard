'use client';

import React from 'react';
import { X, Settings, ExternalLink } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { removeWidget, updateWidget } from '@/store/dashboardSlice';

interface WidgetShellProps {
    id: string;
    title: string;
    onEdit?: () => void;
    children: React.ReactNode;
    dragHandleProps?: any; // props passed from react-grid-layout
    isDragging?: boolean;
}

// react-grid-layout passes styles and className to the root element.
// We must forward refs and style/className for DND to work properly.
const WidgetShell = React.forwardRef<HTMLDivElement, WidgetShellProps & React.HTMLAttributes<HTMLDivElement>>(
    ({ id, title, children, onEdit, style, className, isDragging, ...props }, ref) => {
        const dispatch = useAppDispatch();
        const [isEditing, setIsEditing] = React.useState(false);
        const [tempTitle, setTempTitle] = React.useState(title);

        React.useEffect(() => {
            setTempTitle(title);
        }, [title]);

        const handleRemove = () => {
            if (confirm('Are you sure you want to remove this widget?')) {
                dispatch(removeWidget(id));
            }
        };

        const saveTitle = () => {
            dispatch(updateWidget({ id, changes: { title: tempTitle } }));
            setIsEditing(false);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') saveTitle();
            if (e.key === 'Escape') {
                setTempTitle(title);
                setIsEditing(false);
            }
        }

        return (
            <div
                ref={ref}
                style={style}
                className={`${className} bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm flex flex-col overflow-hidden w-full h-full min-w-0`}
                {...props}
            >
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 drag-handle cursor-move">
                    {isEditing ? (
                        <input
                            type="text"
                            value={tempTitle}
                            onChange={e => setTempTitle(e.target.value)}
                            onBlur={saveTitle}
                            onKeyDown={handleKeyDown}
                            className="text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-900 border border-blue-500 rounded px-1 outline-none w-full mr-2"
                            autoFocus
                            onMouseDown={e => e.stopPropagation()}
                        />
                    ) : (
                        <h3
                            className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate cursor-text"
                            onDoubleClick={() => setIsEditing(true)}
                            title="Double click to edit title"
                        >
                            {title}
                        </h3>
                    )}
                    <div className="flex items-center space-x-1" onMouseDown={(e) => e.stopPropagation()}>
                        {/* Stop propagation so these clicks don't drag */}
                        <button onClick={onEdit} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <Settings size={14} />
                        </button>
                        <button onClick={handleRemove} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 p-4 overflow-auto min-h-0 relative w-full">
                    {children}
                </div>
            </div>
        );
    }
);

WidgetShell.displayName = 'WidgetShell';

export default WidgetShell;
