-- Create types table
CREATE TABLE IF NOT EXISTS types (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'place')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  type_id BIGINT NOT NULL REFERENCES types(id) ON DELETE CASCADE,
  lokasi TEXT NOT NULL,
  link TEXT,
  status BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL CHECK (category IN ('food', 'place')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_type_id ON items(type_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_types_category ON types(category);

-- Enable Row Level Security (RLS)
ALTER TABLE types ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your needs)
-- For development purposes, allowing all operations
-- In production, you might want to add authentication

CREATE POLICY "Allow all operations on types" ON types
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on items" ON items
  FOR ALL USING (true) WITH CHECK (true);

-- Insert some sample data
INSERT INTO types (name, category) VALUES
  ('Restaurant', 'food'),
  ('Cafe', 'food'),
  ('Street Food', 'food'),
  ('Bakery', 'food'),
  ('Museum', 'place'),
  ('Park', 'place'),
  ('Shopping Mall', 'place'),
  ('Beach', 'place')
ON CONFLICT DO NOTHING;

-- Insert some sample items
INSERT INTO items (nama, type_id, lokasi, link, status, category) VALUES
  ('Warung Padang Sederhana', 1, 'Jl. Sudirman No. 123, Jakarta', 'https://instagram.com/warungpadang', false, 'food'),
  ('Kopi Kenangan', 2, 'Mall Central Park, Jakarta', 'https://tiktok.com/@kopikenangan', true, 'food'),
  ('Museum Nasional', 5, 'Jl. Medan Merdeka Barat No. 12, Jakarta', null, false, 'place'),
  ('Taman Mini Indonesia Indah', 6, 'Jl. Raya Taman Mini, Jakarta Timur', 'https://instagram.com/tamanmini', true, 'place')
ON CONFLICT DO NOTHING;