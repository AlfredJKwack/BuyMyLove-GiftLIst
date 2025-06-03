-- Demo data for Gift List App
-- Run this after setting up the main schema to populate with sample gifts

INSERT INTO gifts (title, hyperlink, note, bought, date_added, bought_by_cookie) VALUES
(
  'Wireless Noise-Cancelling Headphones',
  'https://www.amazon.com/dp/B08MVGF24M',
  'Perfect for working from home and travel. Sony WH-1000XM4 with excellent battery life.',
  false,
  '2024-12-01 10:00:00+00',
  null
),
(
  'Smart Coffee Maker',
  'https://www.amazon.com/dp/B077JBQZPX',
  'Programmable coffee maker that can be controlled via smartphone app. Great for morning routines!',
  true,
  '2024-11-28 14:30:00+00',
  'user_demo123_1701234567890'
),
(
  'Kindle Paperwhite E-reader',
  'https://www.amazon.com/dp/B08KTZ8249',
  'Waterproof e-reader with adjustable warm light. Perfect for reading before bed.',
  false,
  '2024-11-25 09:15:00+00',
  null
),
(
  'Yoga Mat with Alignment Lines',
  'https://www.amazon.com/dp/B01LXQZ7QX',
  'High-quality non-slip yoga mat with helpful alignment guides for better poses.',
  false,
  '2024-11-20 16:45:00+00',
  null
),
(
  'Instant Pot Pressure Cooker',
  'https://www.amazon.com/dp/B00FLYWNYQ',
  'Multi-functional pressure cooker that makes meal prep so much easier. 6-quart size is perfect.',
  true,
  '2024-11-15 11:20:00+00',
  'user_demo456_1701234567891'
),
(
  'Bluetooth Mechanical Keyboard',
  'https://www.amazon.com/dp/B07QBPDQPX',
  'Compact 60% mechanical keyboard with RGB lighting. Great for both work and gaming.',
  false,
  '2024-11-10 13:00:00+00',
  null
);

-- Add some demo visitor data (optional - for testing throttling)
INSERT INTO daily_visitors (user_id, ip_address, date, created_at) VALUES
('user_demo123_1701234567890', '192.168.1.100', '2024-12-01', '2024-12-01 10:00:00+00'),
('user_demo456_1701234567891', '192.168.1.101', '2024-12-01', '2024-12-01 11:00:00+00'),
('user_demo789_1701234567892', '192.168.1.102', '2024-12-01', '2024-12-01 12:00:00+00'),
('user_demo101_1701234567893', '192.168.1.103', '2024-12-01', '2024-12-01 13:00:00+00'),
('user_demo112_1701234567894', '192.168.1.104', '2024-12-01', '2024-12-01 14:00:00+00');

-- Note: To test the visitor throttling feature, you would need to add more than 12 unique user_id + ip_address combinations for the same date
