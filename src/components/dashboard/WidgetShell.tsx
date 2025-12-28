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
                className={`${className} glass dark:glass-dark rounded-xl shadow-lg flex flex-col overflow-hidden w-full h-full min-w-0 transition-all duration-300 border-0`}
                {...props}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-white/5 drag-handle cursor-move bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                    {isEditing ? (
                        <input
                            type="text"
                            value={tempTitle}
                            onChange={e => setTempTitle(e.target.value)}
                            onBlur={saveTitle}
                            onKeyDown={handleKeyDown}
                            className="text-sm font-semibold text-gray-800 dark:text-gray-100 bg-transparent border-b border-emerald-500 px-1 outline-none w-full mr-2"
                            autoFocus
                            onMouseDown={e => e.stopPropagation()}
                        />
                    ) : (
                        <h3
                            className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate cursor-text tracking-tight"
                            onDoubleClick={() => setIsEditing(true)}
                            title="Double click to edit title"
                        >
                            {title}
                        </h3>
                    )}
                    <div className="flex items-center space-x-2" onMouseDown={(e) => e.stopPropagation()}>
                        <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors">
                            <Settings size={14} />
                        </button>
                        <button onClick={handleRemove} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors">
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
