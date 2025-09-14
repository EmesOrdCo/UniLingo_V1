-- A2 Fixed Semantic Groups
-- Reset and reorganize A2 into proper semantic groups of 5-20 words

-- Step 1: Reset ALL A2 topic groups to NULL
UPDATE general_english_vocab
SET topic_group = NULL
WHERE cefr_level = 'A2';

-- Step 2: Assign new semantic groups
UPDATE general_english_vocab
SET topic_group = 'Family & Relationships'
WHERE cefr_level = 'A2' AND english_term IN ('adult', 'baby', 'brother', 'daughter', 'female', 'herself', 'husband', 'male', 'marry', 'sister', 'yourself', 'anyone', 'everybody', 'somebody', 'generation');

UPDATE general_english_vocab
SET topic_group = 'Daily Life & Personal Care'
WHERE cefr_level = 'A2' AND english_term IN ('daily', 'afternoon', 'weekend', 'yesterday', 'tomorrow', 'sleep', 'dress', 'clean', 'clothes', 'hair', 'organize', 'maintain', 'attend', 'conference', 'quarter', 'throughout', 'quickly', 'immediately', 'easily', 'advance', 'discover', 'occur', 'recognize');

UPDATE general_english_vocab
SET topic_group = 'Communication & Language'
WHERE cefr_level = 'A2' AND english_term IN ('communication', 'conversation', 'interview', 'discussion', 'comment', 'message', 'speech', 'statement', 'reference', 'define', 'express', 'propose', 'shall', 'unclear', 'agreement', 'argument', 'associate', 'board', 'document', 'link', 'network', 'newspaper', 'original', 'ring', 'search', 'stuff', 'application', 'clearly', 'direct');

UPDATE general_english_vocab
SET topic_group = 'Work & Career'
WHERE cefr_level = 'A2' AND english_term IN ('career', 'professional', 'candidate', 'agent', 'author', 'director', 'officer', 'judge', 'player', 'operation', 'operate', 'task', 'responsibility', 'function', 'achieve', 'aim', 'analysis', 'challenge', 'department', 'determine', 'goal', 'identify', 'investment', 'lack', 'legal', 'option', 'potential', 'profit', 'proposal', 'protect', 'review', 'significant', 'success', 'successful', 'target', 'agency', 'capital', 'production', 'promise', 'property');

UPDATE general_english_vocab
SET topic_group = 'Education & Learning'
WHERE cefr_level = 'A2' AND english_term IN ('college', 'university', 'degree', 'science', 'theory', 'method', 'pattern', 'solution', 'strategy', 'conclusion', 'possibility', 'instance', 'basis');

UPDATE general_english_vocab
SET topic_group = 'Health & Medical'
WHERE cefr_level = 'A2' AND english_term IN ('doctor', 'hospital', 'disease', 'treatment', 'drug', 'dead', 'deep', 'pressure', 'suffer', 'trouble');

UPDATE general_english_vocab
SET topic_group = 'Money & Finance'
WHERE cefr_level = 'A2' AND english_term IN ('dollar', 'cent', 'pound', 'income', 'profit', 'investment', 'credit', 'bill', 'tax', 'earn', 'gain', 'loss', 'worth');

UPDATE general_english_vocab
SET topic_group = 'Time & Scheduling'
WHERE cefr_level = 'A2' AND english_term IN ('clock', 'previous', 'nearly', 'generally', 'completely', 'obviously', 'depend', 'election');

UPDATE general_english_vocab
SET topic_group = 'Places & Locations'
WHERE cefr_level = 'A2' AND english_term IN ('church', 'station', 'restaurant', 'hotel', 'hospital', 'village', 'bar', 'facility', 'floor', 'wall', 'window', 'seat', 'club');

UPDATE general_english_vocab
SET topic_group = 'Transportation & Travel'
WHERE cefr_level = 'A2' AND english_term IN ('bus', 'holiday', 'military', 'mile', 'trip');

UPDATE general_english_vocab
SET topic_group = 'Entertainment & Media'
WHERE cefr_level = 'A2' AND english_term IN ('movie', 'television', 'magazine', 'song', 'dance', 'fun', 'star', 'screen', 'series', 'popular', 'modern');

UPDATE general_english_vocab
SET topic_group = 'Sports & Recreation'
WHERE cefr_level = 'A2' AND english_term IN ('exercise', 'competition', 'race', 'match', 'score', 'movement', 'tend', 'track');

UPDATE general_english_vocab
SET topic_group = 'Nature & Environment'
WHERE cefr_level = 'A2' AND english_term IN ('tree', 'garden', 'sea', 'environment', 'natural', 'green', 'blue', 'red', 'weather', 'season', 'fish', 'dog', 'population', 'resource', 'variety', 'size');

UPDATE general_english_vocab
SET topic_group = 'Objects & Materials'
WHERE cefr_level = 'A2' AND english_term IN ('object', 'item', 'box', 'card', 'file', 'machine', 'oil', 'rock', 'board');

UPDATE general_english_vocab
SET topic_group = 'Emotions & Feelings'
WHERE cefr_level = 'A2' AND english_term IN ('fear', 'sorry', 'welcome', 'smile', 'alone', 'doubt', 'imagine', 'prefer', 'positive', 'ready', 'serious', 'yeah', 'dream', 'guess', 'mine', 'nor', 'okay');

UPDATE general_english_vocab
SET topic_group = 'Actions & Movement'
WHERE cefr_level = 'A2' AND english_term IN ('fly', 'introduce', 'perform', 'prove', 'pull', 'push', 'seek', 'avoid', 'argue', 'debate', 'encourage', 'enter', 'extend', 'fail', 'fix', 'fill', 'mark', 'match', 'replace', 'release', 'separate', 'strike', 'throw', 'touch', 'treat');

UPDATE general_english_vocab
SET topic_group = 'Colors & Appearance'
WHERE cefr_level = 'A2' AND english_term IN ('beautiful', 'dark', 'huge', 'wide', 'shape', 'style', 'cold', 'hot', 'normal', 'traditional', 'useful', 'weight');

UPDATE general_english_vocab
SET topic_group = 'Abstract Concepts & Ideas'
WHERE cefr_level = 'A2' AND english_term IN ('ability', 'access', 'advantage', 'balance', 'basis', 'behavior', 'challenge', 'conclusion', 'contract', 'energy', 'goal', 'memory', 'method', 'pattern', 'possibility', 'potential', 'purpose', 'solution', 'strategy', 'theory', 'trouble', 'worth', 'addition', 'ahead', 'anyway', 'assume', 'below', 'beyond', 'central', 'cross', 'damage', 'despite', 'direction', 'estimate', 'except', 'favorite', 'image', 'indicate', 'loss', 'middle', 'nation', 'post', 'quarter', 'refer', 'reflect', 'relation', 'sing', 'sleep', 'song', 'specific', 'speech', 'station', 'style', 'suddenly', 'supply', 'tend', 'throughout', 'unit', 'version', 'wide', 'yourself', 'basic');

-- Step 3: Verification
SELECT topic_group, COUNT(*) as word_count
FROM general_english_vocab
WHERE cefr_level = 'A2' AND topic_group IS NOT NULL
GROUP BY topic_group
ORDER BY word_count DESC;
