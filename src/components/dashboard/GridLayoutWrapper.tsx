'use client';

import React from 'react';
import RGL from 'react-grid-layout';

// If RGL is strictly default export in this env
const Responsive = RGL as any;
const WidthProvider = (RGL as any).WidthProvider || ((c: any) => c); // Fallback to identity if missing (though it breaks resize)

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function GridLayoutWrapper({ children, ...props }: any) {
    return <ResponsiveGridLayout {...props}>{children}</ResponsiveGridLayout>;
}
