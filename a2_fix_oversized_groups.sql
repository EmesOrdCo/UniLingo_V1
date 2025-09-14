-- Fix oversized A2 groups to meet 5-20 word requirement

-- Reset the oversized group
UPDATE general_english_vocab
SET topic_group = NULL
WHERE cefr_level = 'A2' AND topic_group = 'Abstract Concepts & Ideas';

-- Abstract Concepts & Qualities: 20 terms
UPDATE general_english_vocab
SET topic_group = 'Abstract Concepts & Qualities'
WHERE cefr_level = 'A2' AND english_term IN ('ability', 'access', 'advantage', 'balance', 'basis', 'behavior', 'challenge', 'conclusion', 'contract', 'energy', 'goal', 'memory', 'method', 'pattern', 'possibility', 'potential', 'purpose', 'solution', 'strategy', 'theory');

-- Actions & Processes: 17 terms
UPDATE general_english_vocab
SET topic_group = 'Actions & Processes'
WHERE cefr_level = 'A2' AND english_term IN ('addition', 'cross', 'damage', 'estimate', 'indicate', 'loss', 'refer', 'reflect', 'relation', 'sing', 'sleep', 'song', 'supply', 'tend', 'throughout', 'version', 'basic');

-- Time & Space Concepts: 20 terms
UPDATE general_english_vocab
SET topic_group = 'Time & Space Concepts'
WHERE cefr_level = 'A2' AND english_term IN ('ahead', 'anyway', 'assume', 'below', 'beyond', 'central', 'despite', 'direction', 'except', 'favorite', 'image', 'middle', 'nation', 'post', 'quarter', 'specific', 'speech', 'station', 'style', 'suddenly');

-- General Concepts: 5 terms
UPDATE general_english_vocab
SET topic_group = 'General Concepts'
WHERE cefr_level = 'A2' AND english_term IN ('trouble', 'worth', 'unit', 'wide', 'yourself');

