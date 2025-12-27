export type WidgetType = 'table' | 'chart' | 'card';
export type ChartType = 'line' | 'candle' | 'bar';
export type CardType = 'watchlist' | 'market-gainers' | 'performance' | 'financial' | 'single';
export type ChartInterval = 'daily' | 'weekly' | 'monthly';

export interface ApiConfig {
  provider: 'alpha-vantage' | 'finnhub' | 'indian-api';
  endpoint: string;
  params: Record<string, string>;
}

export interface DataMap {
  [key: string]: string; // key (e.g., 'price') -> path (e.g., 'Global Quote.05. price')
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  apiConfig?: ApiConfig;
  dataMap?: DataMap;
  settings?: {
    refreshInterval?: number;
    viewMode?: 'single' | 'list';
    chartType?: ChartType;
    chartInterval?: ChartInterval;
    cardType?: CardType;
    [key: string]: any;
  };
  format?: 'number' | 'currency' | 'percent' | 'none';
}

export interface DashboardState {
  layouts: {
    lg: any[]; // react-grid-layout types
    md: any[];
    sm: any[];
  };
  widgets: Record<string, WidgetConfig>;
  theme: 'light' | 'dark';
}
