-- B-Level Vocabulary Schema Update
-- This script organizes B1 level topics into B1.1 through B1.6 units
-- Following the same pattern as A-level units

-- First, let's add unit_code column if it doesn't exist
ALTER TABLE general_english_vocab ADD COLUMN IF NOT EXISTS unit_code VARCHAR(10);

-- Create index for unit_code
CREATE INDEX IF NOT EXISTS idx_general_english_vocab_unit_code ON general_english_vocab(unit_code);

-- Insert B1 level vocabulary organized into logical units
-- B1.1: Personal Development & Relationships
INSERT INTO general_english_vocab (english_term, definition, example_sentence, sfi_rank, cefr_level, topic_group, unit_code, translation_spanish, translation_german) VALUES
-- Personal Development
('achieve', 'to successfully complete or reach a goal', 'She worked hard to achieve her dreams.', 1, 'B1', 'Personal Development', 'B1.1', 'lograr', 'erreichen'),
('ambition', 'a strong desire to achieve something', 'His ambition is to become a doctor.', 2, 'B1', 'Personal Development', 'B1.1', 'ambición', 'Ambition'),
('confidence', 'belief in one''s own abilities', 'She gained confidence after the presentation.', 3, 'B1', 'Personal Development', 'B1.1', 'confianza', 'Vertrauen'),
('determination', 'firmness of purpose', 'His determination helped him succeed.', 4, 'B1', 'Personal Development', 'B1.1', 'determinación', 'Entschlossenheit'),
('motivation', 'the reason for acting or behaving', 'What is your motivation for learning English?', 5, 'B1', 'Personal Development', 'B1.1', 'motivación', 'Motivation'),
('potential', 'having the capacity to develop', 'She has great potential as a musician.', 6, 'B1', 'Personal Development', 'B1.1', 'potencial', 'Potenzial'),
('self-esteem', 'confidence in one''s own worth', 'Building self-esteem is important for children.', 7, 'B1', 'Personal Development', 'B1.1', 'autoestima', 'Selbstwertgefühl'),
('strength', 'the quality of being physically or mentally strong', 'Her greatest strength is her patience.', 8, 'B1', 'Personal Development', 'B1.1', 'fuerza', 'Stärke'),
('weakness', 'a quality that makes someone less effective', 'Procrastination is my biggest weakness.', 9, 'B1', 'Personal Development', 'B1.1', 'debilidad', 'Schwäche'),
('challenge', 'a difficult task or situation', 'Learning a new language is a challenge.', 10, 'B1', 'Personal Development', 'B1.1', 'desafío', 'Herausforderung'),

-- Relationships & Social Life
('relationship', 'the way people feel and behave toward each other', 'They have a good relationship with their neighbors.', 11, 'B1', 'Relationships', 'B1.1', 'relación', 'Beziehung'),
('friendship', 'a close relationship between friends', 'Their friendship has lasted for years.', 12, 'B1', 'Relationships', 'B1.1', 'amistad', 'Freundschaft'),
('trust', 'firm belief in the reliability of someone', 'Trust is essential in any relationship.', 13, 'B1', 'Relationships', 'B1.1', 'confianza', 'Vertrauen'),
('respect', 'a feeling of deep admiration for someone', 'We should respect our elders.', 14, 'B1', 'Relationships', 'B1.1', 'respeto', 'Respekt'),
('communication', 'the imparting or exchanging of information', 'Good communication is key to success.', 15, 'B1', 'Relationships', 'B1.1', 'comunicación', 'Kommunikation'),
('support', 'help or encouragement given to someone', 'Thank you for your support during difficult times.', 16, 'B1', 'Relationships', 'B1.1', 'apoyo', 'Unterstützung'),
('conflict', 'a serious disagreement or argument', 'They resolved their conflict peacefully.', 17, 'B1', 'Relationships', 'B1.1', 'conflicto', 'Konflikt'),
('compromise', 'an agreement reached by mutual concession', 'We reached a compromise on the issue.', 18, 'B1', 'Relationships', 'B1.1', 'compromiso', 'Kompromiss'),
('loyalty', 'strong feeling of support or allegiance', 'His loyalty to the company is admirable.', 19, 'B1', 'Relationships', 'B1.1', 'lealtad', 'Loyalität'),
('betrayal', 'the action of betraying someone', 'The betrayal hurt him deeply.', 20, 'B1', 'Relationships', 'B1.1', 'traición', 'Verrat'),

-- Emotions & Feelings
('anxiety', 'a feeling of worry or nervousness', 'She felt anxiety before the exam.', 21, 'B1', 'Emotions', 'B1.1', 'ansiedad', 'Angst'),
('excitement', 'a feeling of great enthusiasm', 'The children were full of excitement.', 22, 'B1', 'Emotions', 'B1.1', 'emoción', 'Aufregung'),
('frustration', 'the feeling of being upset or annoyed', 'He felt frustration when the computer crashed.', 23, 'B1', 'Emotions', 'B1.1', 'frustración', 'Frustration'),
('gratitude', 'the quality of being thankful', 'She expressed gratitude for the help.', 24, 'B1', 'Emotions', 'B1.1', 'gratitud', 'Dankbarkeit'),
('jealousy', 'feeling of envy toward someone', 'His jealousy was obvious to everyone.', 25, 'B1', 'Emotions', 'B1.1', 'celos', 'Eifersucht'),
('pride', 'a feeling of satisfaction in one''s achievements', 'She felt pride in her daughter''s success.', 26, 'B1', 'Emotions', 'B1.1', 'orgullo', 'Stolz'),
('relief', 'a feeling of reassurance and relaxation', 'He felt relief when he found his keys.', 27, 'B1', 'Emotions', 'B1.1', 'alivio', 'Erleichterung'),
('satisfaction', 'fulfillment of one''s wishes or needs', 'The job gave him great satisfaction.', 28, 'B1', 'Emotions', 'B1.1', 'satisfacción', 'Zufriedenheit'),
('sympathy', 'feelings of pity and sorrow for someone', 'She showed sympathy for his situation.', 29, 'B1', 'Emotions', 'B1.1', 'simpatía', 'Sympathie'),
('worry', 'feelings of anxiety or concern', 'Don''t worry about the small things.', 30, 'B1', 'Emotions', 'B1.1', 'preocupación', 'Sorge')
ON CONFLICT (english_term, topic_group) DO NOTHING;

-- B1.2: Work & Career
INSERT INTO general_english_vocab (english_term, definition, example_sentence, sfi_rank, cefr_level, topic_group, unit_code, translation_spanish, translation_german) VALUES
-- Work Environment
('career', 'an occupation undertaken for a significant period', 'She has a successful career in medicine.', 1, 'B1', 'Career', 'B1.2', 'carrera', 'Karriere'),
('profession', 'a paid occupation requiring special training', 'Teaching is a noble profession.', 2, 'B1', 'Career', 'B1.2', 'profesión', 'Beruf'),
('qualification', 'a quality or accomplishment that makes someone suitable', 'You need proper qualifications for this job.', 3, 'B1', 'Career', 'B1.2', 'calificación', 'Qualifikation'),
('experience', 'practical knowledge gained through doing something', 'He has ten years of experience in sales.', 4, 'B1', 'Career', 'B1.2', 'experiencia', 'Erfahrung'),
('skill', 'the ability to do something well', 'Communication is an important skill.', 5, 'B1', 'Career', 'B1.2', 'habilidad', 'Fähigkeit'),
('training', 'the action of teaching a particular skill', 'The company provides training for new employees.', 6, 'B1', 'Career', 'B1.2', 'entrenamiento', 'Training'),
('interview', 'a formal meeting to assess a candidate', 'She has an interview tomorrow morning.', 7, 'B1', 'Career', 'B1.2', 'entrevista', 'Vorstellungsgespräch'),
('resume', 'a brief account of personal qualifications', 'Please send your resume with the application.', 8, 'B1', 'Career', 'B1.2', 'currículum', 'Lebenslauf'),
('promotion', 'advancement to a higher position', 'He received a promotion last month.', 9, 'B1', 'Career', 'B1.2', 'promoción', 'Beförderung'),
('salary', 'a fixed regular payment for work', 'The salary is competitive for this position.', 10, 'B1', 'Career', 'B1.2', 'salario', 'Gehalt'),

-- Workplace Dynamics
('colleague', 'a person with whom one works', 'My colleague helped me with the project.', 11, 'B1', 'Workplace', 'B1.2', 'colega', 'Kollege'),
('supervisor', 'a person who oversees and directs work', 'My supervisor is very supportive.', 12, 'B1', 'Workplace', 'B1.2', 'supervisor', 'Vorgesetzter'),
('deadline', 'the latest time or date for completion', 'We have a deadline next Friday.', 13, 'B1', 'Workplace', 'B1.2', 'fecha límite', 'Termin'),
('meeting', 'an assembly of people for discussion', 'We have a meeting at 3 PM.', 14, 'B1', 'Workplace', 'B1.2', 'reunión', 'Besprechung'),
('project', 'an individual or collaborative enterprise', 'This project will take three months.', 15, 'B1', 'Workplace', 'B1.2', 'proyecto', 'Projekt'),
('responsibility', 'a duty to deal with something', 'It''s your responsibility to finish this task.', 16, 'B1', 'Workplace', 'B1.2', 'responsabilidad', 'Verantwortung'),
('teamwork', 'cooperative work done by a group', 'Teamwork is essential for success.', 17, 'B1', 'Workplace', 'B1.2', 'trabajo en equipo', 'Teamarbeit'),
('efficiency', 'the state of achieving maximum productivity', 'We need to improve our efficiency.', 18, 'B1', 'Workplace', 'B1.2', 'eficiencia', 'Effizienz'),
('productivity', 'the effectiveness of productive effort', 'Productivity has increased this quarter.', 19, 'B1', 'Workplace', 'B1.2', 'productividad', 'Produktivität'),
('performance', 'the action of carrying out a task', 'His performance at work is excellent.', 20, 'B1', 'Workplace', 'B1.2', 'rendimiento', 'Leistung'),

-- Business & Economics
('budget', 'an estimate of income and expenditure', 'We need to stick to our budget.', 21, 'B1', 'Business', 'B1.2', 'presupuesto', 'Budget'),
('profit', 'a financial gain from business', 'The company made a good profit this year.', 22, 'B1', 'Business', 'B1.2', 'beneficio', 'Gewinn'),
('investment', 'the action of investing money for profit', 'Real estate is a good investment.', 23, 'B1', 'Business', 'B1.2', 'inversión', 'Investition'),
('market', 'a place where goods are bought and sold', 'The market is very competitive.', 24, 'B1', 'Business', 'B1.2', 'mercado', 'Markt'),
('customer', 'a person who buys goods or services', 'The customer is always right.', 25, 'B1', 'Business', 'B1.2', 'cliente', 'Kunde'),
('competition', 'the activity of competing', 'There is fierce competition in this industry.', 26, 'B1', 'Business', 'B1.2', 'competencia', 'Wettbewerb'),
('strategy', 'a plan of action to achieve a goal', 'We need a new marketing strategy.', 27, 'B1', 'Business', 'B1.2', 'estrategia', 'Strategie'),
('innovation', 'the action of introducing something new', 'Innovation drives business growth.', 28, 'B1', 'Business', 'B1.2', 'innovación', 'Innovation'),
('entrepreneur', 'a person who starts a business', 'She is a successful entrepreneur.', 29, 'B1', 'Business', 'B1.2', 'emprendedor', 'Unternehmer'),
('leadership', 'the action of leading a group', 'Good leadership inspires the team.', 30, 'B1', 'Business', 'B1.2', 'liderazgo', 'Führung')
ON CONFLICT (english_term, topic_group) DO NOTHING;

-- B1.3: Education & Learning
INSERT INTO general_english_vocab (english_term, definition, example_sentence, sfi_rank, cefr_level, topic_group, unit_code, translation_spanish, translation_german) VALUES
-- Academic Life
('education', 'the process of receiving systematic instruction', 'Education is the key to success.', 1, 'B1', 'Education', 'B1.3', 'educación', 'Bildung'),
('university', 'an institution of higher education', 'She studies at the university.', 2, 'B1', 'Education', 'B1.3', 'universidad', 'Universität'),
('degree', 'an academic qualification awarded by a university', 'He earned a master''s degree.', 3, 'B1', 'Education', 'B1.3', 'título', 'Abschluss'),
('scholarship', 'a grant or payment made to support a student', 'She received a scholarship to study abroad.', 4, 'B1', 'Education', 'B1.3', 'beca', 'Stipendium'),
('tuition', 'fees charged for instruction', 'Tuition fees have increased this year.', 5, 'B1', 'Education', 'B1.3', 'matrícula', 'Studiengebühren'),
('curriculum', 'the subjects comprising a course of study', 'The curriculum includes mathematics and science.', 6, 'B1', 'Education', 'B1.3', 'currículum', 'Lehrplan'),
('assignment', 'a task or piece of work assigned to someone', 'The assignment is due next week.', 7, 'B1', 'Education', 'B1.3', 'tarea', 'Aufgabe'),
('research', 'the systematic investigation of a subject', 'She is conducting research on climate change.', 8, 'B1', 'Education', 'B1.3', 'investigación', 'Forschung'),
('thesis', 'a statement or theory put forward', 'He is writing his doctoral thesis.', 9, 'B1', 'Education', 'B1.3', 'tesis', 'These'),
('graduation', 'the receiving of an academic degree', 'Graduation day was very emotional.', 10, 'B1', 'Education', 'B1.3', 'graduación', 'Abschluss'),

-- Learning Process
('knowledge', 'facts, information, and skills acquired', 'Knowledge is power.', 11, 'B1', 'Learning', 'B1.3', 'conocimiento', 'Wissen'),
('understanding', 'the ability to understand something', 'His understanding of the subject is impressive.', 12, 'B1', 'Learning', 'B1.3', 'comprensión', 'Verständnis'),
('comprehension', 'the ability to understand something', 'Reading comprehension is important.', 13, 'B1', 'Learning', 'B1.3', 'comprensión', 'Verständnis'),
('analysis', 'detailed examination of the elements', 'The analysis shows interesting results.', 14, 'B1', 'Learning', 'B1.3', 'análisis', 'Analyse'),
('synthesis', 'the combination of ideas to form a theory', 'The synthesis of different approaches worked well.', 15, 'B1', 'Learning', 'B1.3', 'síntesis', 'Synthese'),
('evaluation', 'the making of a judgment about something', 'The evaluation of the project was positive.', 16, 'B1', 'Learning', 'B1.3', 'evaluación', 'Bewertung'),
('criticism', 'the expression of disapproval', 'Constructive criticism helps us improve.', 17, 'B1', 'Learning', 'B1.3', 'crítica', 'Kritik'),
('interpretation', 'the action of explaining the meaning', 'His interpretation of the poem was insightful.', 18, 'B1', 'Learning', 'B1.3', 'interpretación', 'Interpretation'),
('concept', 'an abstract idea or general notion', 'This concept is difficult to understand.', 19, 'B1', 'Learning', 'B1.3', 'concepto', 'Konzept'),
('theory', 'a supposition or system of ideas', 'The theory explains the phenomenon.', 20, 'B1', 'Learning', 'B1.3', 'teoría', 'Theorie'),

-- Study Skills
('concentration', 'the action of focusing one''s attention', 'Concentration is essential for studying.', 21, 'B1', 'Study Skills', 'B1.3', 'concentración', 'Konzentration'),
('memorization', 'the process of committing something to memory', 'Memorization helps with vocabulary learning.', 22, 'B1', 'Study Skills', 'B1.3', 'memorización', 'Auswendiglernen'),
('note-taking', 'the practice of recording information', 'Good note-taking skills are valuable.', 23, 'B1', 'Study Skills', 'B1.3', 'tomar notas', 'Notizen machen'),
('revision', 'the action of revising or reviewing', 'Revision before exams is important.', 24, 'B1', 'Study Skills', 'B1.3', 'revisión', 'Wiederholung'),
('examination', 'a formal test of knowledge or ability', 'The examination was challenging but fair.', 25, 'B1', 'Study Skills', 'B1.3', 'examen', 'Prüfung'),
('assessment', 'the evaluation of student performance', 'The assessment will be next month.', 26, 'B1', 'Study Skills', 'B1.3', 'evaluación', 'Bewertung'),
('feedback', 'information about reactions to a product', 'Student feedback helps improve teaching.', 27, 'B1', 'Study Skills', 'B1.3', 'retroalimentación', 'Feedback'),
('improvement', 'the action of making something better', 'There has been significant improvement.', 28, 'B1', 'Study Skills', 'B1.3', 'mejora', 'Verbesserung'),
('progress', 'forward or onward movement', 'She has made excellent progress.', 29, 'B1', 'Study Skills', 'B1.3', 'progreso', 'Fortschritt'),
('achievement', 'a thing done successfully with effort', 'This is a remarkable achievement.', 30, 'B1', 'Study Skills', 'B1.3', 'logro', 'Erfolg')
ON CONFLICT (english_term, topic_group) DO NOTHING;

-- B1.4: Technology & Modern Life
INSERT INTO general_english_vocab (english_term, definition, example_sentence, sfi_rank, cefr_level, topic_group, unit_code, translation_spanish, translation_german) VALUES
-- Digital Technology
('technology', 'the application of scientific knowledge', 'Technology has changed our lives.', 1, 'B1', 'Technology', 'B1.4', 'tecnología', 'Technologie'),
('digital', 'relating to or using computer technology', 'We live in a digital age.', 2, 'B1', 'Technology', 'B1.4', 'digital', 'digital'),
('software', 'programs and other operating information', 'This software is very user-friendly.', 3, 'B1', 'Technology', 'B1.4', 'software', 'Software'),
('hardware', 'the physical parts of a computer', 'The hardware needs to be upgraded.', 4, 'B1', 'Technology', 'B1.4', 'hardware', 'Hardware'),
('application', 'a program designed for end users', 'This application helps with productivity.', 5, 'B1', 'Technology', 'B1.4', 'aplicación', 'Anwendung'),
('database', 'a structured set of data', 'The database contains all customer information.', 6, 'B1', 'Technology', 'B1.4', 'base de datos', 'Datenbank'),
('network', 'a system of interconnected computers', 'The network is down for maintenance.', 7, 'B1', 'Technology', 'B1.4', 'red', 'Netzwerk'),
('internet', 'a global computer network', 'The internet has revolutionized communication.', 8, 'B1', 'Technology', 'B1.4', 'internet', 'Internet'),
('website', 'a location on the World Wide Web', 'Visit our website for more information.', 9, 'B1', 'Technology', 'B1.4', 'sitio web', 'Website'),
('browser', 'a program for accessing websites', 'Which browser do you prefer?', 10, 'B1', 'Technology', 'B1.4', 'navegador', 'Browser'),

-- Communication Technology
('email', 'messages distributed by electronic means', 'I''ll send you an email with the details.', 11, 'B1', 'Communication', 'B1.4', 'correo electrónico', 'E-Mail'),
('message', 'a piece of information sent electronically', 'I received your message this morning.', 12, 'B1', 'Communication', 'B1.4', 'mensaje', 'Nachricht'),
('social media', 'websites and applications for social networking', 'Social media connects people worldwide.', 13, 'B1', 'Communication', 'B1.4', 'redes sociales', 'soziale Medien'),
('platform', 'a system for sharing content', 'This platform is popular among teenagers.', 14, 'B1', 'Communication', 'B1.4', 'plataforma', 'Plattform'),
('profile', 'a user''s personal information on a platform', 'Update your profile with recent information.', 15, 'B1', 'Communication', 'B1.4', 'perfil', 'Profil'),
('privacy', 'the state of being free from observation', 'Privacy settings protect your information.', 16, 'B1', 'Communication', 'B1.4', 'privacidad', 'Privatsphäre'),
('security', 'the state of being free from danger', 'Online security is very important.', 17, 'B1', 'Communication', 'B1.4', 'seguridad', 'Sicherheit'),
('password', 'a secret word used for authentication', 'Choose a strong password for your account.', 18, 'B1', 'Communication', 'B1.4', 'contraseña', 'Passwort'),
('authentication', 'the process of verifying identity', 'Two-factor authentication is more secure.', 19, 'B1', 'Communication', 'B1.4', 'autenticación', 'Authentifizierung'),
('encryption', 'the process of converting information into code', 'Encryption protects sensitive data.', 20, 'B1', 'Communication', 'B1.4', 'cifrado', 'Verschlüsselung'),

-- Modern Lifestyle
('convenience', 'the state of being convenient', 'Online shopping offers great convenience.', 21, 'B1', 'Modern Life', 'B1.4', 'conveniencia', 'Bequemlichkeit'),
('efficiency', 'the state of achieving maximum productivity', 'Technology improves efficiency in the workplace.', 22, 'B1', 'Modern Life', 'B1.4', 'eficiencia', 'Effizienz'),
('automation', 'the use of automatic equipment', 'Automation has replaced many manual jobs.', 23, 'B1', 'Modern Life', 'B1.4', 'automatización', 'Automatisierung'),
('innovation', 'the action of introducing something new', 'Innovation drives technological progress.', 24, 'B1', 'Modern Life', 'B1.4', 'innovación', 'Innovation'),
('trend', 'a general direction in which something is developing', 'This trend is becoming more popular.', 25, 'B1', 'Modern Life', 'B1.4', 'tendencia', 'Trend'),
('virtual', 'not physically existing but made by software', 'Virtual reality is an exciting technology.', 26, 'B1', 'Modern Life', 'B1.4', 'virtual', 'virtuell'),
('artificial', 'made or produced by human beings', 'Artificial intelligence is advancing rapidly.', 27, 'B1', 'Modern Life', 'B1.4', 'artificial', 'künstlich'),
('sustainable', 'able to be maintained at a certain level', 'Sustainable development is important.', 28, 'B1', 'Modern Life', 'B1.4', 'sostenible', 'nachhaltig'),
('renewable', 'capable of being renewed', 'Renewable energy sources are the future.', 29, 'B1', 'Modern Life', 'B1.4', 'renovable', 'erneuerbar'),
('environmental', 'relating to the natural world', 'Environmental protection is crucial.', 30, 'B1', 'Modern Life', 'B1.4', 'ambiental', 'umweltbezogen')
ON CONFLICT (english_term, topic_group) DO NOTHING;

-- B1.5: Health & Lifestyle
INSERT INTO general_english_vocab (english_term, definition, example_sentence, sfi_rank, cefr_level, topic_group, unit_code, translation_spanish, translation_german) VALUES
-- Physical Health
('health', 'the state of being free from illness', 'Good health is more important than wealth.', 1, 'B1', 'Health', 'B1.5', 'salud', 'Gesundheit'),
('exercise', 'physical activity to maintain fitness', 'Regular exercise is essential for health.', 2, 'B1', 'Health', 'B1.5', 'ejercicio', 'Übung'),
('nutrition', 'the process of providing food for health', 'Proper nutrition is important for children.', 3, 'B1', 'Health', 'B1.5', 'nutrición', 'Ernährung'),
('diet', 'the kinds of food a person habitually eats', 'A balanced diet includes fruits and vegetables.', 4, 'B1', 'Health', 'B1.5', 'dieta', 'Diät'),
('vitamin', 'a substance needed for normal growth', 'Vitamin C helps boost the immune system.', 5, 'B1', 'Health', 'B1.5', 'vitamina', 'Vitamin'),
('protein', 'a nutrient essential for body function', 'Protein is important for muscle development.', 6, 'B1', 'Health', 'B1.5', 'proteína', 'Protein'),
('calorie', 'a unit of energy in food', 'This food is high in calories.', 7, 'B1', 'Health', 'B1.5', 'caloría', 'Kalorie'),
('fitness', 'the condition of being physically fit', 'Physical fitness requires regular exercise.', 8, 'B1', 'Health', 'B1.5', 'aptitud física', 'Fitness'),
('wellness', 'the state of being in good health', 'Wellness programs promote healthy living.', 9, 'B1', 'Health', 'B1.5', 'bienestar', 'Wohlbefinden'),
('hygiene', 'conditions or practices conducive to health', 'Personal hygiene is very important.', 10, 'B1', 'Health', 'B1.5', 'higiene', 'Hygiene'),

-- Medical & Healthcare
('medicine', 'the science of diagnosing and treating disease', 'Modern medicine has advanced significantly.', 11, 'B1', 'Medical', 'B1.5', 'medicina', 'Medizin'),
('treatment', 'medical care given to a patient', 'The treatment was successful.', 12, 'B1', 'Medical', 'B1.5', 'tratamiento', 'Behandlung'),
('diagnosis', 'the identification of a disease', 'The doctor made a quick diagnosis.', 13, 'B1', 'Medical', 'B1.5', 'diagnóstico', 'Diagnose'),
('symptom', 'a physical sign of illness', 'Fever is a common symptom of infection.', 14, 'B1', 'Medical', 'B1.5', 'síntoma', 'Symptom'),
('prescription', 'a written instruction for medicine', 'The doctor wrote a prescription for antibiotics.', 15, 'B1', 'Medical', 'B1.5', 'receta', 'Rezept'),
('therapy', 'treatment intended to relieve or heal', 'Physical therapy helped his recovery.', 16, 'B1', 'Medical', 'B1.5', 'terapia', 'Therapie'),
('surgery', 'medical treatment involving cutting', 'The surgery was performed successfully.', 17, 'B1', 'Medical', 'B1.5', 'cirugía', 'Chirurgie'),
('recovery', 'the process of returning to health', 'His recovery was faster than expected.', 18, 'B1', 'Medical', 'B1.5', 'recuperación', 'Erholung'),
('prevention', 'the action of stopping something from happening', 'Prevention is better than cure.', 19, 'B1', 'Medical', 'B1.5', 'prevención', 'Prävention'),
('vaccination', 'treatment with a vaccine to produce immunity', 'Vaccination protects against many diseases.', 20, 'B1', 'Medical', 'B1.5', 'vacunación', 'Impfung'),

-- Lifestyle & Wellness
('lifestyle', 'the way in which a person lives', 'A healthy lifestyle includes exercise and good food.', 21, 'B1', 'Lifestyle', 'B1.5', 'estilo de vida', 'Lebensstil'),
('stress', 'mental or emotional strain', 'Too much stress can affect your health.', 22, 'B1', 'Lifestyle', 'B1.5', 'estrés', 'Stress'),
('relaxation', 'the state of being free from tension', 'Relaxation techniques help reduce stress.', 23, 'B1', 'Lifestyle', 'B1.5', 'relajación', 'Entspannung'),
('meditation', 'the practice of focusing the mind', 'Meditation helps with mental clarity.', 24, 'B1', 'Lifestyle', 'B1.5', 'meditación', 'Meditation'),
('sleep', 'a condition of body and mind in which the nervous system is inactive', 'Good sleep is essential for health.', 25, 'B1', 'Lifestyle', 'B1.5', 'sueño', 'Schlaf'),
('energy', 'the strength and vitality required for activity', 'Exercise gives you more energy.', 26, 'B1', 'Lifestyle', 'B1.5', 'energía', 'Energie'),
('balance', 'a condition in which different elements are equal', 'Work-life balance is important.', 27, 'B1', 'Lifestyle', 'B1.5', 'equilibrio', 'Balance'),
('routine', 'a sequence of actions regularly followed', 'A daily routine helps maintain structure.', 28, 'B1', 'Lifestyle', 'B1.5', 'rutina', 'Routine'),
('habit', 'a settled tendency to act in a particular way', 'Good habits lead to success.', 29, 'B1', 'Lifestyle', 'B1.5', 'hábito', 'Gewohnheit'),
('discipline', 'the practice of training oneself to obey rules', 'Self-discipline is key to achieving goals.', 30, 'B1', 'Lifestyle', 'B1.5', 'disciplina', 'Disziplin')
ON CONFLICT (english_term, topic_group) DO NOTHING;

-- B1.6: Society & Culture
INSERT INTO general_english_vocab (english_term, definition, example_sentence, sfi_rank, cefr_level, topic_group, unit_code, translation_spanish, translation_german) VALUES
-- Social Issues
('society', 'the aggregate of people living together', 'Society has changed significantly over time.', 1, 'B1', 'Society', 'B1.6', 'sociedad', 'Gesellschaft'),
('community', 'a group of people living in the same place', 'The community came together to help.', 2, 'B1', 'Society', 'B1.6', 'comunidad', 'Gemeinschaft'),
('culture', 'the customs and beliefs of a society', 'Culture shapes our worldview.', 3, 'B1', 'Society', 'B1.6', 'cultura', 'Kultur'),
('tradition', 'the transmission of customs or beliefs', 'This tradition has been passed down for generations.', 4, 'B1', 'Society', 'B1.6', 'tradición', 'Tradition'),
('custom', 'a traditional way of behaving', 'It''s a custom to shake hands when meeting.', 5, 'B1', 'Society', 'B1.6', 'costumbre', 'Brauch'),
('heritage', 'valued objects and qualities passed down', 'Cultural heritage should be preserved.', 6, 'B1', 'Society', 'B1.6', 'herencia', 'Erbe'),
('identity', 'the fact of being who or what a person is', 'Cultural identity is important to many people.', 7, 'B1', 'Society', 'B1.6', 'identidad', 'Identität'),
('diversity', 'the state of being diverse', 'Cultural diversity enriches society.', 8, 'B1', 'Society', 'B1.6', 'diversidad', 'Vielfalt'),
('equality', 'the state of being equal', 'Gender equality is a fundamental right.', 9, 'B1', 'Society', 'B1.6', 'igualdad', 'Gleichheit'),
('justice', 'just behavior or treatment', 'Social justice is important for a fair society.', 10, 'B1', 'Society', 'B1.6', 'justicia', 'Gerechtigkeit'),

-- Global Issues
('globalization', 'the process of international integration', 'Globalization has connected the world.', 11, 'B1', 'Global Issues', 'B1.6', 'globalización', 'Globalisierung'),
('environment', 'the natural world', 'We must protect the environment.', 12, 'B1', 'Global Issues', 'B1.6', 'medio ambiente', 'Umwelt'),
('climate', 'the weather conditions in an area', 'Climate change is a serious issue.', 13, 'B1', 'Global Issues', 'B1.6', 'clima', 'Klima'),
('pollution', 'the presence of harmful substances', 'Air pollution affects many cities.', 14, 'B1', 'Global Issues', 'B1.6', 'contaminación', 'Verschmutzung'),
('conservation', 'the action of conserving something', 'Wildlife conservation is important.', 15, 'B1', 'Global Issues', 'B1.6', 'conservación', 'Erhaltung'),
('sustainability', 'the ability to maintain something', 'Sustainability is key to our future.', 16, 'B1', 'Global Issues', 'B1.6', 'sostenibilidad', 'Nachhaltigkeit'),
('migration', 'movement of people from one place to another', 'Migration has shaped many societies.', 17, 'B1', 'Global Issues', 'B1.6', 'migración', 'Migration'),
('refugee', 'a person forced to leave their country', 'Refugees need support and protection.', 18, 'B1', 'Global Issues', 'B1.6', 'refugiado', 'Flüchtling'),
('poverty', 'the state of being extremely poor', 'Poverty affects millions of people worldwide.', 19, 'B1', 'Global Issues', 'B1.6', 'pobreza', 'Armut'),
('development', 'the process of developing', 'Economic development improves living standards.', 20, 'B1', 'Global Issues', 'B1.6', 'desarrollo', 'Entwicklung'),

-- Media & Communication
('media', 'the main means of mass communication', 'The media influences public opinion.', 21, 'B1', 'Media', 'B1.6', 'medios', 'Medien'),
('journalism', 'the activity of writing for newspapers', 'Journalism plays a crucial role in democracy.', 22, 'B1', 'Media', 'B1.6', 'periodismo', 'Journalismus'),
('information', 'facts provided about something', 'Access to information is a basic right.', 23, 'B1', 'Media', 'B1.6', 'información', 'Information'),
('news', 'newly received or noteworthy information', 'The news reported on the latest developments.', 24, 'B1', 'Media', 'B1.6', 'noticias', 'Nachrichten'),
('opinion', 'a view or judgment about something', 'Everyone is entitled to their opinion.', 25, 'B1', 'Media', 'B1.6', 'opinión', 'Meinung'),
('perspective', 'a particular way of viewing something', 'Different perspectives enrich our understanding.', 26, 'B1', 'Media', 'B1.6', 'perspectiva', 'Perspektive'),
('debate', 'a formal discussion on a particular topic', 'The debate was lively and informative.', 27, 'B1', 'Media', 'B1.6', 'debate', 'Debatte'),
('discussion', 'the action of talking about something', 'We had a productive discussion about the issue.', 28, 'B1', 'Media', 'B1.6', 'discusión', 'Diskussion'),
('argument', 'an exchange of diverging views', 'The argument was based on solid evidence.', 29, 'B1', 'Media', 'B1.6', 'argumento', 'Argument'),
('evidence', 'the available body of facts', 'The evidence supports this conclusion.', 30, 'B1', 'Media', 'B1.6', 'evidencia', 'Beweis')
ON CONFLICT (english_term, topic_group) DO NOTHING;

-- Verify the B1 level data meets requirements
-- Check that each unit has at least 5 topic groups and no more than 20
-- Check that there are no NULL entries

-- Count topic groups per B1 unit
SELECT 
    unit_code,
    COUNT(DISTINCT topic_group) as topic_group_count,
    COUNT(*) as total_words
FROM general_english_vocab 
WHERE cefr_level = 'B1' 
GROUP BY unit_code 
ORDER BY unit_code;

-- Check for any NULL values in B1 data
SELECT 
    COUNT(*) as total_b1_records,
    COUNT(CASE WHEN unit_code IS NULL THEN 1 END) as null_unit_codes,
    COUNT(CASE WHEN topic_group IS NULL THEN 1 END) as null_topic_groups,
    COUNT(CASE WHEN english_term IS NULL THEN 1 END) as null_terms
FROM general_english_vocab 
WHERE cefr_level = 'B1';
