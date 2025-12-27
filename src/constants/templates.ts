import { DashboardState } from "@/types/widget";
import { v4 as uuidv4 } from 'uuid';

export interface TemplateInfo {
    id: string;
    name: string;
    description: string;
    category: 'market' | 'portfolio' | 'crypto' | 'indian';
    preview?: string;
}

export const templateInfos: Record<string, TemplateInfo> = {
    'market-overview': {
        id: 'market-overview',
        name: 'Market Overview',
        description: 'Track major US stocks with real-time quotes and market trends',
        category: 'market',
    },
    'indian-market': {
        id: 'indian-market',
        name: 'Indian Market',
        description: 'Monitor NSE stocks and Indian market indices',
        category: 'indian',
    },
    'crypto-tracker': {
        id: 'crypto-tracker',
        name: 'Crypto Tracker',
        description: 'Track cryptocurrency prices and market movements',
        category: 'crypto',
    },
    'portfolio-dashboard': {
        id: 'portfolio-dashboard',
        name: 'Portfolio Dashboard',
        description: 'Comprehensive portfolio tracking with performance metrics',
        category: 'portfolio',
    },
};

export const templates: Record<string, DashboardState> = {
    'market-overview': {
        theme: 'dark',
        layouts: {
            lg: [
                { i: 'card-1', x: 0, y: 0, w: 3, h: 6, minW: 3, minH: 5 },
                { i: 'card-2', x: 3, y: 0, w: 3, h: 6, minW: 3, minH: 5 },
                { i: 'card-3', x: 6, y: 0, w: 3, h: 6, minW: 3, minH: 5 },
                { i: 'card-4', x: 9, y: 0, w: 3, h: 6, minW: 3, minH: 5 },
                { i: 'chart-1', x: 0, y: 6, w: 8, h: 10 },
                { i: 'list-1', x: 9, y: 6, w: 3, h: 6, minW: 3, minH: 5 },
            ],
            md: [],
            sm: []
        },
        widgets: {
            'card-1': { id: 'card-1', type: 'card', title: 'Apple Inc', apiConfig: { provider: 'finnhub', endpoint: 'quote', params: { symbol: 'AAPL' } }, dataMap: { value: 'c' }, format: 'currency', description: 'Current Price' },
            'card-2': { id: 'card-2', type: 'card', title: 'Google', apiConfig: { provider: 'finnhub', endpoint: 'quote', params: { symbol: 'GOOGL' } }, dataMap: { value: 'c' }, format: 'currency', description: 'Current Price' },
            'card-3': { id: 'card-3', type: 'card', title: 'Microsoft', apiConfig: { provider: 'finnhub', endpoint: 'quote', params: { symbol: 'MSFT' } }, dataMap: { value: 'c' }, format: 'currency', description: 'Current Price' },
            'card-4': { id: 'card-4', type: 'card', title: 'Tesla', apiConfig: { provider: 'finnhub', endpoint: 'quote', params: { symbol: 'TSLA' } }, dataMap: { value: 'c' }, format: 'currency', description: 'Current Price' },
            'chart-1': { id: 'chart-1', type: 'chart', title: 'Market Trend (Mock)', apiConfig: { provider: 'alpha-vantage', endpoint: 'TIME_SERIES_DAILY', params: { symbol: 'IBM' } } },
            'list-1': { id: 'list-1', type: 'card', title: 'Top Gainers', settings: { cardType: 'market-gainers' } }
        }
    },
    'indian-market': {
        theme: 'light',
        layouts: {
            lg: [
                { i: 'in-1', x: 0, y: 0, w: 4, h: 4 },
                { i: 'in-2', x: 4, y: 0, w: 4, h: 4 },
                { i: 'in-chart', x: 0, y: 4, w: 12, h: 8 },
            ],
            md: [],
            sm: []
        },
        widgets: {
            'in-1': { id: 'in-1', type: 'card', title: 'Reliance', apiConfig: { provider: 'indian-api', endpoint: 'stock_price', params: { symbol: 'RELIANCE' } }, format: 'currency', description: 'NSE Live' },
            'in-2': { id: 'in-2', type: 'card', title: 'TCS', apiConfig: { provider: 'indian-api', endpoint: 'stock_price', params: { symbol: 'TCS' } }, format: 'currency', description: 'NSE Live' },
            'in-chart': { id: 'in-chart', type: 'chart', title: 'Nifty 50 Trend', apiConfig: { provider: 'indian-api', endpoint: 'stock_price', params: { symbol: 'NIFTY50' } } }
        }
    },
    'crypto-tracker': {
        theme: 'dark',
        layouts: {
            lg: [
                { i: 'crypto-1', x: 0, y: 0, w: 4, h: 4 },
                { i: 'crypto-2', x: 4, y: 0, w: 4, h: 4 },
                { i: 'crypto-3', x: 8, y: 0, w: 4, h: 4 },
                { i: 'crypto-chart', x: 0, y: 4, w: 12, h: 8 },
                { i: 'crypto-table', x: 0, y: 12, w: 12, h: 6 },
            ],
            md: [],
            sm: []
        },
        widgets: {
            'crypto-1': { id: 'crypto-1', type: 'card', title: 'Bitcoin', apiConfig: { provider: 'finnhub', endpoint: 'quote', params: { symbol: 'BINANCE:BTCUSDT' } }, dataMap: { value: 'c' }, format: 'currency', description: 'BTC Price' },
            'crypto-2': { id: 'crypto-2', type: 'card', title: 'Ethereum', apiConfig: { provider: 'finnhub', endpoint: 'quote', params: { symbol: 'BINANCE:ETHUSDT' } }, dataMap: { value: 'c' }, format: 'currency', description: 'ETH Price' },
            'crypto-3': { id: 'crypto-3', type: 'card', title: 'Solana', apiConfig: { provider: 'finnhub', endpoint: 'quote', params: { symbol: 'BINANCE:SOLUSDT' } }, dataMap: { value: 'c' }, format: 'currency', description: 'SOL Price' },
            'crypto-chart': { id: 'crypto-chart', type: 'chart', title: 'Crypto Market Trend', settings: { chartType: 'candle', chartInterval: 'daily' } },
            'crypto-table': { id: 'crypto-table', type: 'table', title: 'Top Cryptocurrencies' },
        }
    },
    'portfolio-dashboard': {
        theme: 'light',
        layouts: {
            lg: [
                { i: 'port-1', x: 0, y: 0, w: 3, h: 6, minW: 3, minH: 5 },
                { i: 'port-2', x: 3, y: 0, w: 3, h: 6, minW: 3, minH: 5 },
                { i: 'port-3', x: 6, y: 0, w: 3, h: 6, minW: 3, minH: 5 },
                { i: 'port-4', x: 9, y: 0, w: 3, h: 6, minW: 3, minH: 5 },
                { i: 'port-performance', x: 0, y: 6, w: 6, h: 6 },
                { i: 'port-chart', x: 6, y: 6, w: 6, h: 6 },
                { i: 'port-table', x: 0, y: 12, w: 12, h: 6 },
            ],
            md: [],
            sm: []
        },
        widgets: {
            'port-1': { id: 'port-1', type: 'card', title: 'Total Value', settings: { cardType: 'single' }, format: 'currency', description: 'Portfolio Value' },
            'port-2': { id: 'port-2', type: 'card', title: 'Daily Gain', settings: { cardType: 'performance' }, format: 'percent' },
            'port-3': { id: 'port-3', type: 'card', title: 'Holdings', settings: { cardType: 'watchlist' } },
            'port-4': { id: 'port-4', type: 'card', title: 'Top Gainers', settings: { cardType: 'market-gainers' } },
            'port-performance': { id: 'port-performance', type: 'card', title: 'Performance Metrics', settings: { cardType: 'performance' } },
            'port-chart': { id: 'port-chart', type: 'chart', title: 'Portfolio Trend', settings: { chartType: 'line', chartInterval: 'weekly' } },
            'port-table': { id: 'port-table', type: 'table', title: 'Portfolio Holdings' },
        }
    }
};
