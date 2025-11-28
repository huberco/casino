'use client';
import React, { useEffect, useRef } from "react";
import {
    createChart,
    ColorType,
    LineStyle,
    UTCTimestamp,
    ISeriesApi,
    CandlestickSeries,
} from "lightweight-charts";

interface Candle {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
}

const BinanceChart: React.FC = () => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const candleSeriesRef = useRef<any | null>(null);
    const topLineRef = useRef<any>(null);
    const bottomLineRef = useRef<any>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const allCandlesRef = useRef<Candle[]>([]);

    // Binance REST endpoint for historical candles
    const fetchHistoricalData = async (symbol = "BTCUSDT", interval = "1m") => {
        const res = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`
        );
        const data = await res.json();
        return data.map((d: any) => ({
            time: (d[0] / 1000) as UTCTimestamp, // convert ms → s
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
        }));
    };

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "#0E0E0E" },
                textColor: "#D1D4DC",
            },
            width: chartContainerRef.current.clientWidth,
            height: 500,
            grid: {
                vertLines: { color: "#1E222D" },
                horzLines: { color: "#1E222D" },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: true, // show seconds for 1s candles
            },
        });

        // ✅ create candlestick series (v5+)
        // ✅ create candlestick series 
        const candleSeries: ISeriesApi<"Candlestick"> = chart.addSeries(
            CandlestickSeries, {
            upColor: "#26a69a",
            borderUpColor: "#26a69a",
            wickUpColor: "#26a69a",
            downColor: "#ef5350",
            borderDownColor: "#ef5350",
            wickDownColor: "#ef5350",
        });

        candleSeriesRef.current = candleSeries;

        // ✅ fetch and set initial historical data
        fetchHistoricalData().then((data) => {
            allCandlesRef.current = data;
            candleSeries.setData(data);

            const lastPrice = data[data.length - 1].close;
            const topLimit = lastPrice * 1.05;
            const bottomLimit = lastPrice * 0.95;

            // ✅ add custom price lines
            topLineRef.current = candleSeries.createPriceLine({
                price: topLimit,
                color: "#ff4d4d",
                lineWidth: 2,
                lineStyle: LineStyle.Dotted,
                axisLabelVisible: true,
                title: "Upper Limit",
            });

            bottomLineRef.current = candleSeries.createPriceLine({
                price: bottomLimit,
                color: "#4dff4d",
                lineWidth: 2,
                lineStyle: LineStyle.Dotted,
                axisLabelVisible: true,
                title: "Lower Limit",
            });
        });

        // ✅ handle resize
        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current?.clientWidth || 0 });
        };
        window.addEventListener("resize", handleResize);

        // ✅ WebSocket live update from Binance (1s kline)
        const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_1m");
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (!msg.k) return;
            const k = msg.k;
        
            const candle: Candle = {
                time: (k.t / 1000) as UTCTimestamp,
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
            };
        
            const lastCandle = allCandlesRef.current[allCandlesRef.current.length - 1];
        
            if (k.x) {
                // Candle is final → add new candle to series and array
                candleSeries.update(candle);
                allCandlesRef.current.push(candle);
            } else {
                // Candle is still forming → only update the series, don't modify array yet
                candleSeries.update(candle);
            }
        };

        return () => {
            ws.close();
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, []);

    return (
        <div
            ref={chartContainerRef}
            style={{ position: "relative", width: "100%", height: "500px" }}
        />
    );
};

export default BinanceChart;
