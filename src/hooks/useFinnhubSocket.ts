import { useEffect, useRef, useState } from 'react';

const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY;

export function useFinnhubSocket(symbol?: string, enabled: boolean = false) {
    const [price, setPrice] = useState<number | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!enabled || !symbol || !FINNHUB_KEY || FINNHUB_KEY === 'demo') return;

        // Establish connection
        const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_KEY}`);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('WS Connected');
            ws.send(JSON.stringify({ type: 'subscribe', symbol: symbol }));
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'trade' && message.data && message.data.length > 0) {
                    // Get the last trade price
                    const lastTrade = message.data[message.data.length - 1];
                    setPrice(lastTrade.p);
                }
            } catch (e) {
                console.error('WS Parse Error', e);
            }
        };

        return () => {
            if (ws.readyState === 1) {
                ws.send(JSON.stringify({ type: 'unsubscribe', symbol: symbol }));
            }
            ws.close();
        };
    }, [symbol, enabled]);

    return price;
}
