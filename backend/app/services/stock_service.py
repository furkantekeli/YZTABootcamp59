"""
Stock service: search, price, and history via yfinance.
Supports BIST (.IS), NYSE, NASDAQ, LSE (.L), and other international markets.
"""

import asyncio
from datetime import datetime, timezone
from typing import Any

import yfinance as yf

from app.schemas.stock import (
    StockSearchResult,
    StockPriceResponse,
    StockHistoryPoint,
    StockHistoryResponse,
)


def _run_sync(func, *args, **kwargs) -> Any:
    """Run a synchronous function in a thread executor."""
    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor() as pool:
        loop = asyncio.get_event_loop()
        return loop.run_in_executor(pool, lambda: func(*args, **kwargs))


BIST_POPULAR = {
    "AEFES.IS": "Anadolu Efes Biracilik ve Malt Sanayii A.S.",
    "AGHOL.IS": "Anadolu Grubu Holding A.S.",
    "AHGAZ.IS": "Ahlatci Dogal Gaz Dagitim Enerji ve Yatirim A.S.",
    "AKBNK.IS": "Akbank T.A.S.",
    "AKSEN.IS": "Aksa Enerji Uretim A.S.",
    "ALARK.IS": "Alarko Holding A.S.",
    "ALFAS.IS": "Alfa Solar Enerji Sanayi ve Ticaret A.S.",
    "ARCLK.IS": "Arcelik A.S.",
    "ASELS.IS": "Aselsan Elektronik Sanayi ve Ticaret A.S.",
    "ASTOR.IS": "Astor Enerji A.S.",
    "BIMAS.IS": "BIM Birlesik Magazalar A.S.",
    "BRYAT.IS": "Borusan Yatirim ve Pazarlama A.S.",
    "BUCIM.IS": "Bursa Cimento Fabrikasi A.S.",
    "CCOLA.IS": "Coca-Cola Icecek A.S.",
    "CWENE.IS": "CW Enerji Muhendislik Ticaret ve Sanayi A.S.",
    "DOAS.IS": "Dogus Otomotiv Servis ve Ticaret A.S.",
    "DOHOL.IS": "Dogan Sirketler Grubu Holding A.S.",
    "EGEEN.IS": "Ege Endustri ve Ticaret A.S.",
    "EKGYO.IS": "Emlak Konut Gayrimenkul Yatirim Ortakligi A.S.",
    "ENJSA.IS": "Enerjisa Enerji A.S.",
    "ENKAI.IS": "Enka Insaat ve Sanayi A.S.",
    "EREGL.IS": "Eregli Demir ve Celik Fabrikalari T.A.S.",
    "EUPWR.IS": "Europower Enerji ve Otomasyon Teknolojileri Sanayi Ticaret A.S.",
    "FROTO.IS": "Ford Otomotiv Sanayi A.S.",
    "GARAN.IS": "Turkiye Garanti Bankasi A.S.",
    "GESAN.IS": "Girisim Elektrik Taahhut Ticaret ve Sanayi A.S.",
    "GUBRF.IS": "Gubre Fabrikalari T.A.S.",
    "HALKB.IS": "Turkiye Halk Bankasi A.S.",
    "HEKTS.IS": "Hektas Ticaret T.A.S.",
    "IPEKE.IS": "Ipek Dogal Enerji Kaynaklari Arastirma ve Uretim A.S.",
    "ISCTR.IS": "Turkiye Is Bankasi A.S.",
    "ISGYO.IS": "Is Gayrimenkul Yatirim Ortakligi A.S.",
    "KARDMD.IS": "Kardemir Karabuk Demir Celik Sanayi ve Ticaret A.S.",
    "KAYSE.IS": "Kayseri Seker Fabrikasi A.S.",
    "KCAER.IS": "Kocaer Celik Sanayi ve Ticaret A.S.",
    "KCHOL.IS": "Koc Holding A.S.",
    "KENT.IS": "Kent Gida Maddeleri Sanayii ve Ticaret A.S.",
    "KONTR.IS": "Kontrolmatik Teknoloji Enerji ve Muhendislik A.S.",
    "KOZAL.IS": "Koza Altin Isletmeleri A.S.",
    "KOZAA.IS": "Koza Anadolu Metal Madencilik Isletmeleri A.S.",
    "KRDMD.IS": "Kardemir Karabuk Demir Celik Sanayi ve Ticaret A.S.",
    "MAVI.IS": "Mavi Giyim Sanayi ve Ticaret A.S.",
    "MGROS.IS": "Migros Ticaret A.S.",
    "MIATK.IS": "Mia Teknoloji A.S.",
    "ODAS.IS": "Odas Elektrik Uretim Sanayi Ticaret A.S.",
    "OTKAR.IS": "Otokar Otomotiv ve Savunma Sanayi A.S.",
    "OYAKC.IS": "Oyak Cimento Fabrikalari A.S.",
    "PETKM.IS": "Petkim Petrokimya Holding A.S.",
    "PGSUS.IS": "Pegasus Hava Tasimaciligi A.S.",
    "SAHOL.IS": "Sabanci Holding A.S.",
    "SASA.IS": "Sasa Polyester Sanayi A.S.",
    "SISE.IS": "Turkiye Sise ve Cam Fabrikalari A.S.",
    "SMRTG.IS": "Smart Gunes Enerjisi Teknolojileri Arastirma Gelistirme Sanayi ve Ticaret A.S.",
    "SOKM.IS": "Sok Marketler Ticaret A.S.",
    "TARKM.IS": "Tarkim Bitki Koruma Sanayi ve Ticaret A.S.",
    "TAVHL.IS": "Tav Havalimanlari Holding A.S.",
    "TCELL.IS": "Turkcell Iletisim Hizmetleri A.S.",
    "THYAO.IS": "Turk Hava Yollari A.O.",
    "TKFEN.IS": "Tekfen Holding A.S.",
    "TOASO.IS": "Tofas Turk Otomobil Fabrikasi A.S.",
    "TSKB.IS": "Turkiye Sinai Kalkinma Bankasi A.S.",
    "TTKOM.IS": "Turk Telekomunikasyon A.S.",
    "TUPRS.IS": "Turkiye Petrol Rafinerileri A.S.",
    "VAKBN.IS": "Turkiye Vakiflar Bankasi T.A.O.",
    "VESBE.IS": "Vestel Beyaz Esya Sanayi ve Ticaret A.S.",
    "VESTL.IS": "Vestel Elektronik Sanayi ve Ticaret A.S.",
    "YEOTK.IS": "Yeo Teknoloji Enerji ve Endustri A.S.",
    "YKBNK.IS": "Yapi ve Kredi Bankasi A.S.",
    "ZOREN.IS": "Zorlu Enerji Elektrik Uretim A.S."
}


async def search_stock(query: str) -> list[StockSearchResult]:
    """
    Search for stocks matching the query.
    Combines local BIST autocomplete with yfinance global Search API.
    """
    results: list[StockSearchResult] = []
    query_upper = query.upper().strip()
    seen_symbols: set[str] = set()

    # 1. Local Autocomplete Search for BIST stocks (Alphabetical)
    local_matches = []
    for symbol, name in BIST_POPULAR.items():
        # Match symbol prefix or containing query, or name containing query
        if query_upper in symbol.upper() or query_upper in name.upper():
            local_matches.append((symbol, name))

    # Sort BIST stocks alphabetically by symbol
    local_matches.sort(key=lambda x: x[0])

    # Convert to StockSearchResult schema (Limit to top 15 local matches)
    for symbol, name in local_matches[:15]:
        seen_symbols.add(symbol)
        results.append(
            StockSearchResult(
                symbol=symbol,
                name=name,
                exchange="IST",
                stock_type="EQUITY",
                currency="TRY"
            )
        )

    # 2. Global yfinance Search API Call (to query other markets/indices)
    try:
        # yf.Search executes network calls to Yahoo API
        search = await asyncio.to_thread(lambda: yf.Search(query_upper, max_results=8))
        if search and search.quotes:
            for quote in search.quotes:
                symbol = quote.get("symbol")
                if not symbol or symbol in seen_symbols:
                    continue
                seen_symbols.add(symbol)
                
                # Extract clean display name
                name = quote.get("longname") or quote.get("shortname") or symbol
                
                results.append(
                    StockSearchResult(
                        symbol=symbol,
                        name=name,
                        exchange=quote.get("exchDisp") or quote.get("exchange"),
                        stock_type=quote.get("typeDisp") or "EQUITY",
                        currency=quote.get("currency") or "USD"
                    )
                )
    except Exception:
        pass

    return results


async def get_stock_price(symbol: str) -> StockPriceResponse:
    """
    Get the current price and market data for a stock symbol.

    Args:
        symbol: Stock symbol (e.g. 'THYAO.IS', 'AAPL', 'BARC.L').

    Returns:
        StockPriceResponse with current price and market data.
    """
    try:
        ticker = await asyncio.to_thread(lambda: yf.Ticker(symbol))
        info = await asyncio.to_thread(lambda: ticker.info)

        return StockPriceResponse(
            symbol=symbol,
            current_price=info.get("regularMarketPrice") or info.get("currentPrice"),
            previous_close=info.get("previousClose") or info.get("regularMarketPreviousClose"),
            open_price=info.get("regularMarketOpen") or info.get("open"),
            day_high=info.get("regularMarketDayHigh") or info.get("dayHigh"),
            day_low=info.get("regularMarketDayLow") or info.get("dayLow"),
            volume=info.get("regularMarketVolume") or info.get("volume"),
            market_cap=info.get("marketCap"),
            currency=info.get("currency"),
            name=info.get("longName") or info.get("shortName"),
        )
    except Exception:
        return StockPriceResponse(symbol=symbol)


async def get_stock_history(
    symbol: str, period: str = "1mo"
) -> StockHistoryResponse:
    """
    Get historical price data for a stock.

    Args:
        symbol: Stock symbol.
        period: Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max).

    Returns:
        StockHistoryResponse with list of OHLCV data points.
    """
    valid_periods = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"}
    if period not in valid_periods:
        period = "1mo"

    try:
        ticker = await asyncio.to_thread(lambda: yf.Ticker(symbol))
        hist = await asyncio.to_thread(lambda: ticker.history(period=period))

        data_points: list[StockHistoryPoint] = []
        for date_idx, row in hist.iterrows():
            data_points.append(
                StockHistoryPoint(
                    date=date_idx.strftime("%Y-%m-%d"),
                    open=round(row["Open"], 2),
                    high=round(row["High"], 2),
                    low=round(row["Low"], 2),
                    close=round(row["Close"], 2),
                    volume=int(row["Volume"]),
                )
            )

        return StockHistoryResponse(
            symbol=symbol,
            period=period,
            data=data_points,
        )
    except Exception:
        return StockHistoryResponse(symbol=symbol, period=period, data=[])


async def update_stock_price(symbol: str) -> dict[str, Any] | None:
    """
    Fetch and return the latest price data for updating a PortfolioStock.

    Returns:
        Dict with 'current_price' and 'last_price_update', or None on failure.
    """
    try:
        price_data = await get_stock_price(symbol)
        if price_data.current_price is not None:
            return {
                "current_price": price_data.current_price,
                "last_price_update": datetime.now(timezone.utc),
            }
    except Exception:
        pass
    return None
