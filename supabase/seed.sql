-- Common products from the Gulf / Arab market so search, alternatives and
-- the demo work before anyone scans anything. Values per 100 g / 100 ml,
-- typical for the product type (not a specific brand).

insert into public.products
  (name_ar, name_en, category, is_drink, energy_kcal, sugar_g, fat_g, sat_fat_g, salt_g, fiber_g, protein_g, carbs_g, allergens, additives, is_halal, has_animal_ingredients, has_animal_products, source)
values
  ('ماء',                     'Water',                    'drinks', true,    0,  0,    0,    0,    0,    0,   0,    0,    '{}',          '{}',              true, false, false, 'seed'),
  ('مشروب غازي',              'Cola soft drink',          'drinks', true,   42, 10.6,  0,    0,    0,    0,   0,   10.6,  '{}',          '{e150d,e338}',    true, false, false, 'seed'),
  ('مشروب غازي دايت',         'Diet cola',                'drinks', true,    0,  0,    0,    0,  0.02,   0,   0,    0,    '{}',          '{e150d,e338,e951,e950}', true, false, false, 'seed'),
  ('عصير برتقال معلّب',       'Orange juice drink',       'drinks', true,   48, 11.5,  0,    0,  0.01,   0, 0.2,  11.8,  '{}',          '{e330}',          true, false, false, 'seed'),
  ('عصير برتقال طبيعي 100٪',  '100% orange juice',        'drinks', true,   45,  8.4,  0.2,  0,    0,  0.2, 0.7,  10.4,  '{}',          '{}',              true, false, false, 'seed'),
  ('مشروب طاقة',              'Energy drink',             'drinks', true,   45, 11,    0,    0,  0.2,    0,   0,   11,    '{}',          '{e330,e211,e150d}', true, false, false, 'seed'),
  ('لبن قليل الدسم',          'Low-fat laban',            'dairy',  true,   38,  4.5,  1,  0.6,  0.15,   0, 3.2,  4.5,  '{milk}',      '{}',              true, false, true,  'seed'),
  ('حليب كامل الدسم',         'Full-fat milk',            'dairy',  true,   61,  4.7,  3.3, 2.1, 0.1,    0, 3.2,  4.7,  '{milk}',      '{}',              true, false, true,  'seed'),
  ('حليب بالفراولة',          'Strawberry milk',          'dairy',  true,   85, 12,    2.5, 1.6, 0.1,    0, 3,   13,    '{milk}',      '{e129,e407}',     true, false, true,  'seed'),
  ('زبادي يوناني سادة',       'Plain Greek yoghurt',      'dairy',  false,  97,  3.6,  5,   3.2, 0.1,    0, 9,    3.9,  '{milk}',      '{}',              true, false, true,  'seed'),
  ('جبن شيدر',                'Cheddar cheese',           'dairy',  false, 403,  0.5, 33,  21,   1.8,    0, 25,   1.3,  '{milk}',      '{e160b}',         true, false, true,  'seed'),
  ('لبنة',                    'Labneh',                   'dairy',  false, 154,  3,   10,   6.5, 1.2,    0, 8,    4,    '{milk}',      '{}',              true, false, true,  'seed'),
  ('خبز أبيض',                'White bread',              'bakery', false, 265,  4.5,  3.2, 0.7, 1.1,  2.7, 9,   49,    '{gluten}',    '{e282}',          true, false, false, 'seed'),
  ('خبز بر (قمح كامل)',       'Wholewheat bread',         'bakery', false, 247,  4,    3.4, 0.7, 1,    6.8, 13,  41,    '{gluten}',    '{}',              true, false, false, 'seed'),
  ('كرواسون',                 'Croissant',                'bakery', false, 406, 11,   21,  12,   1,    2.6,  8,   45,    '{gluten,milk,eggs}', '{e471}',    true, false, true,  'seed'),
  ('شيبس بطاطس مملح',         'Salted potato chips',      'snacks', false, 536,  0.5, 34,   3.1, 1.6,  4.4, 6.6, 53,    '{}',          '{e621}',          true, false, false, 'seed'),
  ('فشار بدون زبدة',          'Plain air-popped popcorn', 'snacks', false, 387,  0.9,  4.5, 0.6, 0.02,15,   13,   78,    '{}',          '{}',              true, false, false, 'seed'),
  ('مكسرات مشكلة غير مملحة',  'Unsalted mixed nuts',      'snacks', false, 607,  4.2, 54,   7,   0.02, 7,   20,   21,    '{nuts}',      '{}',              true, false, false, 'seed'),
  ('تمر',                     'Dates',                    'fruits_vegetables', false, 282, 63, 0.4, 0, 0, 8, 2.5, 75, '{}',         '{}',              true, false, false, 'seed'),
  ('بسكويت بالشوكولاتة',      'Chocolate biscuits',       'sweets', false, 480, 30,   20,  11,   0.6,  3,    6,   68,    '{gluten,milk,soy}', '{e322,e500}', true, false, true,  'seed'),
  ('شوكولاتة داكنة 70٪',      'Dark chocolate 70%',       'sweets', false, 580, 24,   42,  25,   0.02,11,    8,   33,    '{milk,soy}',  '{e322}',          true, false, true,  'seed'),
  ('حلاوة طحينية',            'Halva',                    'sweets', false, 516, 45,   30,   5,   0.4,  4,   12,   50,    '{sesame}',    '{}',              true, false, false, 'seed'),
  ('رقائق ذرة',               'Corn flakes',              'cereals', false, 378, 8,    0.9, 0.2, 1.1,  3,    7,   84,    '{}',          '{}',              true, false, false, 'seed'),
  ('شوفان',                   'Rolled oats',              'cereals', false, 379, 1,    6.5, 1.1, 0.01,10,   13,   60,    '{gluten}',    '{}',              true, false, false, 'seed'),
  ('حمص بالطحينة',            'Hummus',                   'sauces_spreads', false, 166, 0.3, 9.6, 1.4, 0.9, 6, 7.9, 14, '{sesame}', '{}',           true, false, false, 'seed'),
  ('كاتشب',                   'Ketchup',                  'sauces_spreads', false, 112, 22, 0.1, 0, 1.8, 0.3, 1.2, 26, '{}',       '{}',              true, false, false, 'seed'),
  ('مايونيز',                 'Mayonnaise',               'sauces_spreads', false, 680, 1.3, 75, 6, 1.5, 0, 1, 1.5,     '{eggs}',      '{e385}',          true, false, true,  'seed'),
  ('تونة بالماء',             'Tuna in water',            'meat_fish', false, 116, 0,  0.8, 0.2, 0.8,  0,  26,    0,    '{fish}',      '{}',              true, true,  true,  'seed'),
  ('نقانق دجاج',              'Chicken sausages',         'meat_fish', false, 240, 1.5, 19, 5.5, 2.1,  0,  13,    4,    '{}',          '{e250,e451}',     true, true,  true,  'seed'),
  ('كبسة دجاج',               'Chicken kabsa',            'meals',  false, 180,  1.5,  6,   1.5, 0.8,  1,  10,   21,    '{}',          '{}',              true, true,  true,  'seed');
