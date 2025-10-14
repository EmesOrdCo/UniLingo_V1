-- Add translation columns to arcade_games table
-- This allows games to be displayed in multiple languages

-- Add translation columns
ALTER TABLE arcade_games
ADD COLUMN IF NOT EXISTS french_name TEXT,
ADD COLUMN IF NOT EXISTS french_description TEXT,
ADD COLUMN IF NOT EXISTS spanish_name TEXT,
ADD COLUMN IF NOT EXISTS spanish_description TEXT,
ADD COLUMN IF NOT EXISTS german_name TEXT,
ADD COLUMN IF NOT EXISTS german_description TEXT,
ADD COLUMN IF NOT EXISTS mandarin_name TEXT,
ADD COLUMN IF NOT EXISTS mandarin_description TEXT,
ADD COLUMN IF NOT EXISTS hindi_name TEXT,
ADD COLUMN IF NOT EXISTS hindi_description TEXT;

-- Update existing games with translations (you can customize these later)

-- Hextris translations
UPDATE arcade_games SET
  french_name = 'Hextris',
  french_description = 'Jeu de puzzle rapide sur une grille hexagonale. Faites tourner l''hexagone pour assortir les couleurs!',
  spanish_name = 'Hextris',
  spanish_description = 'Juego de puzzle rápido en una cuadrícula hexagonal. ¡Gira el hexágono para combinar colores!',
  german_name = 'Hextris',
  german_description = 'Rasantes Puzzlespiel auf einem sechseckigen Gitter. Drehe das Sechseck, um Farben zu kombinieren!',
  mandarin_name = '六边形方块',
  mandarin_description = '快节奏的六边形网格拼图游戏。旋转六边形以匹配颜色！',
  hindi_name = 'हेक्सट्रिस',
  hindi_description = 'षट्कोणीय ग्रिड पर तेज़-तर्रार पहेली खेल। रंगों को मिलाने के लिए षट्कोण को घुमाएं!'
WHERE name = 'Hextris';

-- 2048 translations
UPDATE arcade_games SET
  french_name = '2048',
  french_description = 'Assemblez les nombres et atteignez la tuile 2048! Jeu de puzzle addictif.',
  spanish_name = '2048',
  spanish_description = '¡Une los números y alcanza la casilla 2048! Juego de puzzle adictivo.',
  german_name = '2048',
  german_description = 'Füge die Zahlen zusammen und erreiche die 2048-Kachel! Süchtig machendes Puzzlespiel.',
  mandarin_name = '2048',
  mandarin_description = '合并数字，达到2048方块！令人上瘾的益智游戏。',
  hindi_name = '2048',
  hindi_description = 'संख्याओं को जोड़ें और 2048 टाइल तक पहुंचें! नशे की लत पहेली खेल।'
WHERE name = '2048';

-- Flappy Bird translations
UPDATE arcade_games SET
  french_name = 'Flappy Bird',
  french_description = 'Tapez pour voler et traverser les tuyaux. Jusqu''où pouvez-vous aller?',
  spanish_name = 'Flappy Bird',
  spanish_description = 'Toca para volar y pasar por las tuberías. ¿Hasta dónde puedes llegar?',
  german_name = 'Flappy Bird',
  german_description = 'Tippe zum Flattern und fliege durch die Rohre. Wie weit kommst du?',
  mandarin_name = '笨鸟先飞',
  mandarin_description = '点击拍打翅膀，穿过管道。你能飞多远？',
  hindi_name = 'फ्लैपी बर्ड',
  hindi_description = 'उड़ने के लिए टैप करें और पाइपों से गुजरें। आप कितनी दूर जा सकते हैं?'
WHERE name = 'Flappy Bird';

-- Snake translations
UPDATE arcade_games SET
  french_name = 'Serpent',
  french_description = 'Jeu classique du serpent. Mangez la nourriture et grandissez sans vous mordre!',
  spanish_name = 'Serpiente',
  spanish_description = 'Juego clásico de la serpiente. ¡Come la comida y crece sin morderte!',
  german_name = 'Schlange',
  german_description = 'Klassisches Schlangenspiel. Friss das Futter und wachse, ohne dich selbst zu beißen!',
  mandarin_name = '贪吃蛇',
  mandarin_description = '经典贪吃蛇游戏。吃食物并成长，但不要碰到自己！',
  hindi_name = 'सांप',
  hindi_description = 'क्लासिक सांप का खेल। खाना खाएं और बढ़ें बिना खुद को काटे!'
WHERE name = 'Snake';

-- Tetris translations
UPDATE arcade_games SET
  french_name = 'Tetris',
  french_description = 'Le jeu de puzzle intemporel. Complétez les lignes en formant des rangées!',
  spanish_name = 'Tetris',
  spanish_description = '¡El juego de puzzle atemporal. Completa líneas formando filas!',
  german_name = 'Tetris',
  german_description = 'Das zeitlose Puzzlespiel. Vervollständige Linien, indem du Reihen bildest!',
  mandarin_name = '俄罗斯方块',
  mandarin_description = '永恒的益智游戏。通过完成行来清除线条！',
  hindi_name = 'टेट्रिस',
  hindi_description = 'कालातीत पहेली खेल। पंक्तियां पूरी करके लाइनें साफ़ करें!'
WHERE name = 'Tetris';

-- Breakout translations
UPDATE arcade_games SET
  french_name = 'Breakout',
  french_description = 'Cassez toutes les briques avec votre raquette et balle. Action d''arcade classique!',
  spanish_name = 'Breakout',
  spanish_description = '¡Rompe todos los ladrillos con tu paleta y pelota. Acción arcade clásica!',
  german_name = 'Breakout',
  german_description = 'Zerstöre alle Steine mit deinem Schläger und Ball. Klassische Arcade-Action!',
  mandarin_name = '打砖块',
  mandarin_description = '用你的挡板和球打破所有砖块。经典街机动作！',
  hindi_name = 'ब्रेकआउट',
  hindi_description = 'अपने पैडल और गेंद से सभी ईंटों को तोड़ें। क्लासिक आर्केड एक्शन!'
WHERE name = 'Breakout';

-- Space Invaders translations
UPDATE arcade_games SET
  french_name = 'Space Invaders',
  french_description = 'Défendez la Terre contre les envahisseurs aliens! Abattez-les tous!',
  spanish_name = 'Space Invaders',
  spanish_description = '¡Defiende la Tierra de los invasores alienígenas! ¡Derriba a todos!',
  german_name = 'Space Invaders',
  german_description = 'Verteidige die Erde gegen Alien-Invasoren! Schieß sie alle ab!',
  mandarin_name = '太空侵略者',
  mandarin_description = '保卫地球免受外星入侵者！击落所有敌人！',
  hindi_name = 'स्पेस इनवेडर्स',
  hindi_description = 'पृथ्वी को एलियन आक्रमणकारियों से बचाएं! सभी को मार गिराएं!'
WHERE name = 'Space Invaders';

-- Pac-Man translations
UPDATE arcade_games SET
  french_name = 'Pac-Man',
  french_description = 'Mangez tous les points en évitant les fantômes. Un vrai classique!',
  spanish_name = 'Pac-Man',
  spanish_description = 'Come todos los puntos mientras evitas los fantasmas. ¡Un verdadero clásico!',
  german_name = 'Pac-Man',
  german_description = 'Friss alle Punkte, während du den Geistern ausweichst. Ein echter Klassiker!',
  mandarin_name = '吃豆人',
  mandarin_description = '吃掉所有豆子，避开幽灵。真正的经典！',
  hindi_name = 'पैक-मैन',
  hindi_description = 'भूतों से बचते हुए सभी बिंदुओं को खाएं। एक सच्चा क्लासिक!'
WHERE name = 'Pac-Man';

-- Create a view to get games in a specific language
CREATE OR REPLACE VIEW arcade_games_localized AS
SELECT 
  id,
  name as english_name,
  description as english_description,
  french_name,
  french_description,
  spanish_name,
  spanish_description,
  german_name,
  german_description,
  mandarin_name,
  mandarin_description,
  hindi_name,
  hindi_description,
  game_url,
  xp_cost,
  category,
  difficulty,
  is_active,
  play_count,
  created_at
FROM arcade_games;

-- Function to get games in a specific language
CREATE OR REPLACE FUNCTION get_arcade_games_by_language(p_language TEXT DEFAULT 'english')
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  game_url TEXT,
  xp_cost INTEGER,
  category TEXT,
  difficulty TEXT,
  is_active BOOLEAN,
  play_count INTEGER,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ag.id,
    CASE p_language
      WHEN 'french' THEN COALESCE(ag.french_name, ag.name)
      WHEN 'spanish' THEN COALESCE(ag.spanish_name, ag.name)
      WHEN 'german' THEN COALESCE(ag.german_name, ag.name)
      WHEN 'mandarin' THEN COALESCE(ag.mandarin_name, ag.name)
      WHEN 'hindi' THEN COALESCE(ag.hindi_name, ag.name)
      ELSE ag.name
    END,
    CASE p_language
      WHEN 'french' THEN COALESCE(ag.french_description, ag.description)
      WHEN 'spanish' THEN COALESCE(ag.spanish_description, ag.description)
      WHEN 'german' THEN COALESCE(ag.german_description, ag.description)
      WHEN 'mandarin' THEN COALESCE(ag.mandarin_description, ag.description)
      WHEN 'hindi' THEN COALESCE(ag.hindi_description, ag.description)
      ELSE ag.description
    END,
    ag.game_url,
    ag.xp_cost,
    ag.category,
    ag.difficulty,
    ag.is_active,
    ag.play_count,
    ag.created_at
  FROM arcade_games ag
  WHERE ag.is_active = true
  ORDER BY ag.category, ag.name;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM get_arcade_games_by_language('french');
-- SELECT * FROM get_arcade_games_by_language('spanish');
-- SELECT * FROM get_arcade_games_by_language('mandarin');

