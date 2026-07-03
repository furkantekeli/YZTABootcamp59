-- ═══════════════════════════════════════════════════════════
-- Portfolio Tracker - Database Initialization
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Portfolios Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    currency VARCHAR(10) DEFAULT 'TRY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Portfolio Stocks Table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_stocks (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(200),
    exchange VARCHAR(50),
    total_lots INTEGER DEFAULT 0,
    avg_cost DECIMAL(15, 4) DEFAULT 0,
    current_price DECIMAL(15, 4) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'TRY',
    last_price_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, symbol)
);

-- ─── Transactions Table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    portfolio_stock_id INTEGER NOT NULL REFERENCES portfolio_stocks(id) ON DELETE CASCADE,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
    lots INTEGER NOT NULL CHECK (lots > 0),
    price DECIMAL(15, 4) NOT NULL CHECK (price > 0),
    commission DECIMAL(15, 4) DEFAULT 0,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── AI Analyses Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_analyses (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    prompt TEXT,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_stocks_portfolio_id ON portfolio_stocks(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_stocks_symbol ON portfolio_stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_stock_id ON transactions(portfolio_stock_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_portfolio_id ON ai_analyses(portfolio_id);

-- ─── Updated At Trigger Function ────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ─── Apply Triggers ─────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_portfolios_updated_at') THEN
        CREATE TRIGGER update_portfolios_updated_at
            BEFORE UPDATE ON portfolios
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_portfolio_stocks_updated_at') THEN
        CREATE TRIGGER update_portfolio_stocks_updated_at
            BEFORE UPDATE ON portfolio_stocks
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;
