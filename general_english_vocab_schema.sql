-- General English Vocabulary Table Schema
-- This table contains vocabulary items for Unit 1 and other units

-- Create the general_english_vocab table
CREATE TABLE IF NOT EXISTS general_english_vocab (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  english_term VARCHAR(255) NOT NULL,
  definition TEXT NOT NULL,
  example_sentence TEXT NOT NULL,
  sfi_rank INTEGER NOT NULL DEFAULT 1,
  cefr_level VARCHAR(10) CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')) DEFAULT 'A1',
  topic_group VARCHAR(100) NOT NULL,
  
  -- Translation fields
  translation_spanish VARCHAR(255),
  translation_german VARCHAR(255),
  
  -- Example sentences in other languages
  example_sentence_spanish TEXT,
  example_sentence_german TEXT,
  example_sentence_2 TEXT,
  example_sentence_3 TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_general_english_vocab_topic_group ON general_english_vocab(topic_group);
CREATE INDEX IF NOT EXISTS idx_general_english_vocab_sfi_rank ON general_english_vocab(sfi_rank);
CREATE INDEX IF NOT EXISTS idx_general_english_vocab_cefr_level ON general_english_vocab(cefr_level);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_general_english_vocab_updated_at ON general_english_vocab;
CREATE TRIGGER update_general_english_vocab_updated_at
    BEFORE UPDATE ON general_english_vocab
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE general_english_vocab ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read vocabulary
CREATE POLICY "Anyone can read vocabulary" ON general_english_vocab
  FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON general_english_vocab TO anon, authenticated;

-- Insert Basic Concepts vocabulary for Unit 1 (A1.1)
INSERT INTO general_english_vocab (english_term, definition, example_sentence, sfi_rank, cefr_level, topic_group, translation_spanish, translation_german, example_sentence_spanish, example_sentence_german) VALUES
('walk', 'to move on foot at a regular pace', 'I walk to school every day.', 1, 'A1', 'Basic Concepts', 'caminar', 'gehen', 'Camino a la escuela todos los días.', 'Ich gehe jeden Tag zur Schule.'),
('run', 'to move quickly on foot', 'She runs in the park every morning.', 2, 'A1', 'Basic Concepts', 'correr', 'rennen', 'Ella corre en el parque cada mañana.', 'Sie rennt jeden Morgen im Park.'),
('sit', 'to rest on the lower part of the body', 'Please sit down and relax.', 3, 'A1', 'Basic Concepts', 'sentarse', 'sitzen', 'Por favor, siéntate y relájate.', 'Bitte setz dich hin und entspann dich.'),
('stand', 'to be in an upright position on the feet', 'Stand up when the teacher enters.', 4, 'A1', 'Basic Concepts', 'pararse', 'stehen', 'Párate cuando entre el profesor.', 'Steh auf, wenn der Lehrer hereinkommt.'),
('eat', 'to put food in the mouth and swallow it', 'We eat dinner at 7 PM.', 5, 'A1', 'Basic Concepts', 'comer', 'essen', 'Cenamos a las 7 PM.', 'Wir essen um 19 Uhr zu Abend.'),
('drink', 'to take liquid into the mouth and swallow it', 'I drink water every hour.', 6, 'A1', 'Basic Concepts', 'beber', 'trinken', 'Bebo agua cada hora.', 'Ich trinke jede Stunde Wasser.'),
('sleep', 'to rest with eyes closed and mind unconscious', 'I sleep eight hours every night.', 7, 'A1', 'Basic Concepts', 'dormir', 'schlafen', 'Duermo ocho horas cada noche.', 'Ich schlafe acht Stunden jede Nacht.'),
('wake', 'to stop sleeping', 'I wake up at 6 AM.', 8, 'A1', 'Basic Concepts', 'despertarse', 'aufwachen', 'Me despierto a las 6 AM.', 'Ich wache um 6 Uhr auf.'),
('read', 'to look at and understand written words', 'She reads books every evening.', 9, 'A1', 'Basic Concepts', 'leer', 'lesen', 'Ella lee libros cada noche.', 'Sie liest jeden Abend Bücher.'),
('write', 'to form letters and words on paper', 'Students write essays in class.', 10, 'A1', 'Basic Concepts', 'escribir', 'schreiben', 'Los estudiantes escriben ensayos en clase.', 'Studenten schreiben Aufsätze im Unterricht.'),
('listen', 'to pay attention to sounds', 'Listen carefully to the music.', 11, 'A1', 'Basic Concepts', 'escuchar', 'zuhören', 'Escucha cuidadosamente la música.', 'Hör der Musik aufmerksam zu.'),
('speak', 'to say words to express thoughts', 'He speaks three languages.', 12, 'A1', 'Basic Concepts', 'hablar', 'sprechen', 'Él habla tres idiomas.', 'Er spricht drei Sprachen.'),
('look', 'to direct the eyes toward something', 'Look at the beautiful sunset.', 13, 'A1', 'Basic Concepts', 'mirar', 'schauen', 'Mira el hermoso atardecer.', 'Schau dir den schönen Sonnenuntergang an.'),
('see', 'to perceive with the eyes', 'I can see the mountains from here.', 14, 'A1', 'Basic Concepts', 'ver', 'sehen', 'Puedo ver las montañas desde aquí.', 'Ich kann die Berge von hier aus sehen.'),
('hear', 'to perceive sounds with the ears', 'Can you hear the birds singing?', 15, 'A1', 'Basic Concepts', 'oír', 'hören', '¿Puedes oír los pájaros cantando?', 'Kannst du die Vögel singen hören?'),
('touch', 'to feel something with the hands', 'Don''t touch the hot stove.', 16, 'A1', 'Basic Concepts', 'tocar', 'berühren', 'No toques la estufa caliente.', 'Berühre nicht den heißen Herd.'),
('feel', 'to experience a sensation', 'I feel happy today.', 17, 'A1', 'Basic Concepts', 'sentir', 'fühlen', 'Me siento feliz hoy.', 'Ich fühle mich heute glücklich.'),
('think', 'to use the mind to consider something', 'Think before you speak.', 18, 'A1', 'Basic Concepts', 'pensar', 'denken', 'Piensa antes de hablar.', 'Denk nach, bevor du sprichst.'),
('know', 'to have information about something', 'I know the answer to that question.', 19, 'A1', 'Basic Concepts', 'saber', 'wissen', 'Sé la respuesta a esa pregunta.', 'Ich weiß die Antwort auf diese Frage.'),
('learn', 'to gain knowledge or skills', 'Children learn quickly.', 20, 'A1', 'Basic Concepts', 'aprender', 'lernen', 'Los niños aprenden rápido.', 'Kinder lernen schnell.')
ON CONFLICT (english_term, topic_group) DO NOTHING;

-- Insert some general vocabulary for other units
INSERT INTO general_english_vocab (english_term, definition, example_sentence, sfi_rank, cefr_level, topic_group, translation_spanish, translation_german) VALUES
('hello', 'a greeting used when meeting someone', 'Hello, how are you today?', 1, 'A1', 'general', 'hola', 'hallo'),
('goodbye', 'a farewell when leaving', 'Goodbye, see you tomorrow!', 2, 'A1', 'general', 'adiós', 'auf Wiedersehen'),
('please', 'used to make a polite request', 'Please help me with this.', 3, 'A1', 'general', 'por favor', 'bitte'),
('thank you', 'an expression of gratitude', 'Thank you for your help.', 4, 'A1', 'general', 'gracias', 'danke'),
('yes', 'an affirmative response', 'Yes, I understand.', 5, 'A1', 'general', 'sí', 'ja'),
('no', 'a negative response', 'No, I don''t think so.', 6, 'A1', 'general', 'no', 'nein')
ON CONFLICT (english_term, topic_group) DO NOTHING;
