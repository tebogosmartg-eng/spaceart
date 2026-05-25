-- Seed categories
INSERT INTO categories (slug, name, description, icon, sort_order) VALUES
  ('music', 'Music', 'African sounds, production, and live performance', 'music', 1),
  ('fashion', 'Fashion', 'Contemporary African fashion and styling', 'shirt', 2),
  ('photography', 'Photography', 'Visual storytelling and portrait artistry', 'camera', 3),
  ('performance', 'Performance', 'Theatre, dance, and live creative expression', 'mic', 4),
  ('crafts', 'Crafts', 'Handmade artistry and cultural craft', 'palette', 5),
  ('design', 'Design', 'Graphic, product, and spatial design', 'pen-tool', 6)
ON CONFLICT (slug) DO NOTHING;
