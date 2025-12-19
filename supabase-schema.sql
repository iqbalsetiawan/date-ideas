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
  name TEXT NOT NULL,
  type_id BIGINT NOT NULL REFERENCES types(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  status BOOLEAN DEFAULT FALSE,
  visited_at DATE,
  position BIGINT,
  category TEXT NOT NULL CHECK (category IN ('food', 'place')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create item_locations table for multiple branches per item
CREATE TABLE IF NOT EXISTS item_locations (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  status BOOLEAN DEFAULT FALSE,
  visited_at DATE,
  position BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_type_id ON items(type_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_position ON items(position);
CREATE INDEX IF NOT EXISTS idx_types_category ON types(category);

-- Enable Row Level Security (RLS)
ALTER TABLE types ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your needs)
-- For development purposes, allowing all operations
-- In production, you might want to add authentication

CREATE POLICY "Allow all operations on types" ON types
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on items" ON items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on item_locations" ON item_locations
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
INSERT INTO items (name, type_id, location, status, category) VALUES
  ('Warung Padang Sederhana', 1, 'https://maps.app.goo.gl/uiA8uuGXLvu4mD428', false, 'food'),
  ('Kopi Kenangan', 2, 'https://maps.app.goo.gl/sEckWHzDDizBdrW46', true, 'food'),
  ('Street Food Delight', 3, 'https://maps.app.goo.gl/3h3h3h3h3h3h3h3h', false, 'food'),
  ('Bakery Bliss', 4, 'https://maps.app.goo.gl/4h4h4h4h4h4h4h4h', true, 'food'),
  ('Museum Nasional', 5, 'https://maps.app.goo.gl/jqh3x7YWjec5GyVa6', false, 'place'),
  ('Taman Mini Indonesia Indah', 6, 'https://maps.app.goo.gl/YL5jRb74TJ7JxqBK6', true, 'place'),
  ('Beachfront Paradise', 7, 'https://maps.app.goo.gl/7h7h7h7h7h7h7h7h', false, 'place')
ON CONFLICT DO NOTHING;