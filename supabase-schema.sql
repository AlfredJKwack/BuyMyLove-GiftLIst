-- Gift List App Database Schema for Supabase

-- Create gifts table
CREATE TABLE IF NOT EXISTS gifts (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    hyperlink TEXT NOT NULL,
    note TEXT,
    image_url TEXT,
    bought BOOLEAN NOT NULL DEFAULT FALSE,
    date_added TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    bought_by_cookie TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create daily_visitors table for throttling
CREATE TABLE IF NOT EXISTS daily_visitors (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, ip_address, date)
);

-- Create alerts table for admin notifications
CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gifts_date_added ON gifts(date_added DESC);
CREATE INDEX IF NOT EXISTS idx_gifts_bought ON gifts(bought);
CREATE INDEX IF NOT EXISTS idx_daily_visitors_date ON daily_visitors(date);
CREATE INDEX IF NOT EXISTS idx_daily_visitors_user_ip ON daily_visitors(user_id, ip_address);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gifts table (allow all operations for anonymous users)
CREATE POLICY "Allow all operations on gifts" ON gifts
    FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for daily_visitors table (allow all operations)
CREATE POLICY "Allow all operations on daily_visitors" ON daily_visitors
    FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for alerts table (allow all operations)
CREATE POLICY "Allow all operations on alerts" ON alerts
    FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for gifts table
CREATE TRIGGER update_gifts_updated_at 
    BEFORE UPDATE ON gifts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for images bucket (allow all operations)
CREATE POLICY "Allow all operations on images bucket" ON storage.objects
    FOR ALL USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');
