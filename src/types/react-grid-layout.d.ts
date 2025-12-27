declare module 'react-grid-layout' {
    import * as React from 'react';

    export interface Layout {
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
        minW?: number;
        maxW?: number;
        minH?: number;
        maxH?: number;
        static?: boolean;
        isDraggable?: boolean;
        isResizable?: boolean;
    }

    export interface ResponsiveProps {
        className?: string;
        style?: React.CSSProperties;
        width?: number;
        autoSize?: boolean;
        cols?: { [key: string]: number };
        draggableCancel?: string;
        draggableHandle?: string;
        verticalCompact?: boolean;
        compactType?: 'vertical' | 'horizontal';
        layout?: Layout[];
        layouts?: { [key: string]: Layout[] };
        margin?: [number, number];
        containerPadding?: [number, number] | { [key: string]: [number, number] };
        rowHeight?: number;
        maxRows?: number;
        isDraggable?: boolean;
        isResizable?: boolean;
        isBounded?: boolean;
        useCSSTransforms?: boolean;
        transformScale?: number;
        droppingItem?: { i: string; w: number; h: number };
        resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
        resizeHandle?: React.ReactNode | ((resizeHandleAxis: any, ref: React.Ref<HTMLElement>) => React.ReactNode);
        onLayoutChange?: (layout: Layout[], layouts: { [key: string]: Layout[] }) => void;
        onWidthChange?: (containerWidth: number, margin: [number, number], cols: number, containerPadding: [number, number]) => void;
        onBreakpointChange?: (newBreakpoint: string, newCols: number) => void;
        onDrop?: (layout: Layout[], item: Layout, e: Event) => void;
        onDragStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: Event, element: HTMLElement) => void;
        onDrag?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: Event, element: HTMLElement) => void;
        onDragStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: Event, element: HTMLElement) => void;
        onResizeStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: Event, element: HTMLElement) => void;
        onResize?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: Event, element: HTMLElement) => void;
        onResizeStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: Event, element: HTMLElement) => void;
        children?: React.ReactNode;
    }

    export class Responsive extends React.Component<ResponsiveProps, any> { }
    export class WidthProvider extends React.Component<any, any> { }

    export default Responsive;
    // Also export as named for convenience if needed, matching usage
}
