import os
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False
    print("Warning: MetaTrader5 not installed. Using mock data.")


class OHLCBar(BaseModel):
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: int


class OHLCResponse(BaseModel):
    success: bool
    symbol: str
    timeframe: str
    count: int
    data: list[OHLCBar]


SYMBOL_SUFFIX = os.getenv("MT5_SYMBOL_SUFFIX", ".sc")
DEFAULT_SYMBOL = os.getenv("MT5_DEFAULT_SYMBOL", "XAUUSD")

VALID_TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"]

TIMEFRAME_MINUTES = {
    "M1": 1,
    "M5": 5,
    "M15": 15,
    "M30": 30,
    "H1": 60,
    "H4": 240,
    "D1": 1440,
    "W1": 10080,
}

mt5_initialized = False


def init_mt5():
    global mt5_initialized
    if not MT5_AVAILABLE:
        return False

    if mt5_initialized:
        return True

    mt5_path = os.getenv("MT5_PATH")
    init_params = {"path": mt5_path} if mt5_path else {}

    if not mt5.initialize(**init_params):
        print(f"MT5 initialize failed: {mt5.last_error()}")
        return False

    mt5_initialized = True
    print("MT5 initialized successfully")
    return True


def shutdown_mt5():
    global mt5_initialized
    if MT5_AVAILABLE and mt5_initialized:
        mt5.shutdown()
        mt5_initialized = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_mt5()
    yield
    shutdown_mt5()


app = FastAPI(
    title="MT5 OHLC API",
    description="API to fetch OHLC data from MetaTrader 5",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def generate_mock_data(symbol: str, timeframe: str, count: int) -> list[OHLCBar]:
    """Generate mock OHLC data for development without MT5"""
    import random

    bars = []
    base_price = 2350.0 if symbol == "XAUUSD" else 1.1000
    current_time = int(datetime.now().timestamp())
    timeframe_minutes = TIMEFRAME_MINUTES.get(timeframe, 60)
    interval_seconds = timeframe_minutes * 60

    price = base_price
    for i in range(count):
        bar_time = current_time - (count - i - 1) * interval_seconds
        change = random.uniform(-5, 5)
        open_price = price
        close_price = price + change
        high_price = max(open_price, close_price) + random.uniform(0, 3)
        low_price = min(open_price, close_price) - random.uniform(0, 3)
        volume = random.randint(100, 1000)

        bars.append(OHLCBar(
            time=bar_time,
            open=round(open_price, 2),
            high=round(high_price, 2),
            low=round(low_price, 2),
            close=round(close_price, 2),
            volume=volume,
        ))
        price = close_price

    return bars


def get_mt5_timeframe(timeframe: str):
    """Map timeframe string to MT5 constant"""
    if not MT5_AVAILABLE:
        return None

    tf_map = {
        "M1": mt5.TIMEFRAME_M1,
        "M5": mt5.TIMEFRAME_M5,
        "M15": mt5.TIMEFRAME_M15,
        "M30": mt5.TIMEFRAME_M30,
        "H1": mt5.TIMEFRAME_H1,
        "H4": mt5.TIMEFRAME_H4,
        "D1": mt5.TIMEFRAME_D1,
        "W1": mt5.TIMEFRAME_W1,
    }
    return tf_map.get(timeframe)


def get_full_symbol(symbol: str) -> str:
    """Add broker suffix to symbol if not present"""
    if SYMBOL_SUFFIX and not symbol.endswith(SYMBOL_SUFFIX):
        return f"{symbol}{SYMBOL_SUFFIX}"
    return symbol


def get_mt5_ohlc(symbol: str, timeframe: str, count: int) -> list[OHLCBar]:
    """Fetch real OHLC data from MT5"""
    if not MT5_AVAILABLE or not mt5_initialized:
        return generate_mock_data(symbol, timeframe, count)

    tf_value = get_mt5_timeframe(timeframe)
    if tf_value is None:
        raise HTTPException(status_code=400, detail=f"Invalid timeframe: {timeframe}")

    full_symbol = get_full_symbol(symbol)

    if not mt5.symbol_select(full_symbol, True):
        raise HTTPException(
            status_code=404,
            detail=f"Symbol not found: {full_symbol}",
        )

    rates = mt5.copy_rates_from_pos(full_symbol, tf_value, 0, count)
    if rates is None:
        error = mt5.last_error()
        raise HTTPException(status_code=500, detail=f"MT5 error: {error}")

    bars = []
    for rate in rates:
        bars.append(OHLCBar(
            time=int(rate["time"]),
            open=float(rate["open"]),
            high=float(rate["high"]),
            low=float(rate["low"]),
            close=float(rate["close"]),
            volume=int(rate["tick_volume"]),
        ))

    return bars


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "mt5_available": MT5_AVAILABLE,
        "mt5_connected": mt5_initialized,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/ohlc", response_model=OHLCResponse)
async def get_ohlc(
    symbol: str = Query(default="XAUUSD", description="Trading symbol"),
    timeframe: str = Query(default="H1", description="Timeframe (M1, M5, M15, M30, H1, H4, D1, W1)"),
    count: int = Query(default=100, ge=1, le=500, description="Number of bars"),
):
    """Fetch OHLC candlestick data from MT5"""
    if timeframe not in VALID_TIMEFRAMES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid timeframe. Must be one of: {VALID_TIMEFRAMES}",
        )

    bars = get_mt5_ohlc(symbol, timeframe, count)

    return OHLCResponse(
        success=True,
        symbol=symbol,
        timeframe=timeframe,
        count=len(bars),
        data=bars,
    )


@app.get("/xauusd")
async def get_xauusd(
    tf: str = Query(default="M1", description="Timeframe"),
    limit: int = Query(default=100, ge=1, le=500, description="Number of bars"),
):
    """Simple endpoint matching the Flask server format"""
    if tf not in VALID_TIMEFRAMES:
        return {"error": f"Invalid timeframe: {tf}"}

    if not MT5_AVAILABLE or not mt5_initialized:
        bars = generate_mock_data("XAUUSD", tf, limit)
    else:
        try:
            bars = get_mt5_ohlc("XAUUSD", tf, limit)
        except HTTPException as e:
            return {"error": e.detail}

    return [
        {
            "time": bar.time,
            "open": bar.open,
            "high": bar.high,
            "low": bar.low,
            "close": bar.close,
        }
        for bar in bars
    ]


@app.get("/symbols")
async def get_symbols():
    """Get available trading symbols"""
    if not MT5_AVAILABLE or not mt5_initialized:
        return {
            "success": True,
            "symbols": ["XAUUSD"],
            "note": "Mock mode - returning default symbol",
        }

    symbols = mt5.symbols_get()
    if symbols is None:
        return {"success": True, "symbols": []}

    symbol_names = [s.name for s in symbols if s.visible]
    return {"success": True, "symbols": symbol_names}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
