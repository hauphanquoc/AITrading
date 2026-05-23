import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'] as const;
type Timeframe = typeof TIMEFRAMES[number];

interface OHLCBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickDataPoint {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartViewerProps {
  selectedTimeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}

export function ChartViewer({ selectedTimeframe, onTimeframeChange }: ChartViewerProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['ohlc', selectedTimeframe],
    queryFn: async () => {
      const res = await api.get('/chart/ohlc', {
        params: { symbol: 'XAUUSD', timeframe: selectedTimeframe, count: 200 },
      });
      return res.data.data as OHLCBar[];
    },
    refetchInterval: selectedTimeframe === 'M1' ? 5000 : 15000,
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#1f2937' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (data && seriesRef.current) {
      const chartData: CandlestickDataPoint[] = data.map((bar) => ({
        time: bar.time as UTCTimestamp,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      }));

      seriesRef.current.setData(chartData);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-white">XAUUSD</span>
          <span className="text-sm text-gray-400">Gold / US Dollar</span>
        </div>
        <div className="flex items-center gap-2">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                selectedTimeframe === tf
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            className="ml-2 px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-800/80 flex items-center justify-center z-10">
            <div className="text-gray-400">Loading chart...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-gray-800/80 flex items-center justify-center z-10">
            <div className="text-red-400">Failed to load chart data</div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {data && data.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-700 flex items-center justify-between text-sm">
          <div className="flex gap-6">
            <div>
              <span className="text-gray-400">Open: </span>
              <span className="text-white">{data[data.length - 1].open.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-400">High: </span>
              <span className="text-green-400">{data[data.length - 1].high.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-400">Low: </span>
              <span className="text-red-400">{data[data.length - 1].low.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-400">Close: </span>
              <span className="text-white">{data[data.length - 1].close.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-400 text-xs">
              Live · {new Date(dataUpdatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
