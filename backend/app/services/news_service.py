"""
News service: parses Turkish financial RSS feeds and fetches stock-specific news.
"""

import asyncio
from datetime import datetime
import feedparser
import yfinance as yf

RSS_FEEDS = {
    "Bloomberg HT": "https://www.bloomberght.com/rss",
    "Dünya": "https://www.dunya.com/rss?dunya",
    "Investing.com TR": "https://tr.investing.com/rss/news.rss",
}


async def get_financial_news() -> list[dict]:
    """
    Fetch and parse general financial news from Turkish RSS feeds.
    """
    news_items = []

    def _parse_feed(source_name: str, url: str) -> list[dict]:
        items = []
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:10]:  # Limit to 10 entries per source
                # Try to extract description safely
                summary = entry.get("summary") or entry.get("description") or ""
                # Strip HTML tags from summary if needed
                import re
                summary_clean = re.sub(r"<[^>]+>", "", summary).strip()

                published = entry.get("published") or entry.get("pubDate") or ""

                items.append({
                    "title": entry.get("title", ""),
                    "link": entry.get("link", ""),
                    "summary": summary_clean[:250] + "..." if len(summary_clean) > 250 else summary_clean,
                    "published": published,
                    "source": source_name,
                })
        except Exception:
            pass
        return items

    # Parse feeds in parallel using asyncio.to_thread
    tasks = [
        asyncio.to_thread(_parse_feed, name, url)
        for name, url in RSS_FEEDS.items()
    ]
    results = await asyncio.gather(*tasks)

    for item_list in results:
        news_items.extend(item_list)

    # Sort news items by published date if possible, otherwise keep order
    # (For simplicity we just return combined list or shuffle/alternating)
    return news_items


async def get_stock_news(symbol: str) -> list[dict]:
    """
    Fetch news articles related to a specific stock symbol.
    Uses yfinance ticker news for international/US stocks, and filters
    RSS feeds for BIST/Turkish stocks.
    """
    symbol_upper = symbol.upper().strip()
    news_items = []

    # If it's a BIST stock (ends in .IS) or has letters only, we try filtering local RSS
    # AND fetching from yfinance
    if symbol_upper.endswith(".IS"):
        clean_symbol = symbol_upper.replace(".IS", "")
        # Get general news first
        general_news = await get_financial_news()
        # Filter general news by symbol or common terms
        for item in general_news:
            if clean_symbol in item["title"] or clean_symbol in item["summary"]:
                news_items.append(item)

    # Also query yfinance news
    try:
        ticker = await asyncio.to_thread(lambda: yf.Ticker(symbol_upper))
        yf_news = await asyncio.to_thread(lambda: ticker.news)

        if yf_news:
            for article in yf_news[:10]:
                published_time = ""
                try:
                    # yfinance news uses timestamp (seconds since epoch)
                    ts = article.get("providerPublishTime")
                    if ts:
                        published_time = datetime.fromtimestamp(ts).strftime("%d.%m.%Y %H:%M")
                except Exception:
                    pass

                news_items.append({
                    "title": article.get("title", ""),
                    "link": article.get("link", ""),
                    "summary": article.get("summary", "") or f"{symbol_upper} ile ilgili güncel gelişmeler.",
                    "published": published_time,
                    "source": article.get("publisher", "Yahoo Finance"),
                })
    except Exception:
        pass

    return news_items
