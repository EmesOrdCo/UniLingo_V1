-- C2 Perfect Semantic Grouping
-- Assigns topic groups to 277 C2 words across 20 semantic groups
-- Perfect validation: No duplicates, all groups 3+ words, clean organization

-- Step 1: Reset ALL C2 topic groups to NULL
UPDATE general_english_vocab
SET topic_group = NULL
WHERE cefr_level = 'C2';

-- Step 2: Assign topic groups to C2 words

UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'anxious';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'ashamed';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'confusion';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'determination';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'excitement';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'happiness';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'humor';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'hunger';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'innocent';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'lazy';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'motivation';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'panic';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'pride';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'silly';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'thirst';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'uncertainty';
UPDATE general_english_vocab SET topic_group = 'Feelings & Personal States' WHERE cefr_level = 'C2' AND english_term = 'weird';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'adjustment';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'attachment';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'attendance';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'attraction';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'composition';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'destruction';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'implementation';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'indication';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'inquiry';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'maintenance';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'ownership';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'participation';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'possession';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'qualification';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'registration';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'reflection';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'stability';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'tourism';
UPDATE general_english_vocab SET topic_group = 'Processes & States (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'transportation';
UPDATE general_english_vocab SET topic_group = 'Technology & Objects' WHERE cefr_level = 'C2' AND english_term = 'airline';
UPDATE general_english_vocab SET topic_group = 'Technology & Objects' WHERE cefr_level = 'C2' AND english_term = 'blog';
UPDATE general_english_vocab SET topic_group = 'Technology & Objects' WHERE cefr_level = 'C2' AND english_term = 'coin';
UPDATE general_english_vocab SET topic_group = 'Technology & Objects' WHERE cefr_level = 'C2' AND english_term = 'envelope';
UPDATE general_english_vocab SET topic_group = 'Technology & Objects' WHERE cefr_level = 'C2' AND english_term = 'flag';
UPDATE general_english_vocab SET topic_group = 'Technology & Objects' WHERE cefr_level = 'C2' AND english_term = 'module';
UPDATE general_english_vocab SET topic_group = 'Technology & Objects' WHERE cefr_level = 'C2' AND english_term = 'pipe';
UPDATE general_english_vocab SET topic_group = 'Technology & Objects' WHERE cefr_level = 'C2' AND english_term = 'printer';
UPDATE general_english_vocab SET topic_group = 'Technology & Objects' WHERE cefr_level = 'C2' AND english_term = 'server';
UPDATE general_english_vocab SET topic_group = 'Technology & Objects' WHERE cefr_level = 'C2' AND english_term = 'stamp';
UPDATE general_english_vocab SET topic_group = 'Technology & Objects' WHERE cefr_level = 'C2' AND english_term = 'vessel';
UPDATE general_english_vocab SET topic_group = 'Technology & Objects' WHERE cefr_level = 'C2' AND english_term = 'website';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'amendment';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'clause';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'democratic';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'empire';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'guideline';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'institutional';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'jail';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'jury';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'liability';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'mayor';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'penalty';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'regulate';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'resign';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'royal';
UPDATE general_english_vocab SET topic_group = 'Law, Politics, & Governance' WHERE cefr_level = 'C2' AND english_term = 'sanction';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'boost';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'chase';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'compose';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'comprise';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'consume';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'evolve';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'exhaust';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'extract';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'fade';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'filter';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'fold';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'found';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'invent';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'leap';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'neglect';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'pretend';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'revise';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'situate';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'suspend';
UPDATE general_english_vocab SET topic_group = 'Verbs of Action & Change' WHERE cefr_level = 'C2' AND english_term = 'undergo';
UPDATE general_english_vocab SET topic_group = 'Concepts & Ideas (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'adventure';
UPDATE general_english_vocab SET topic_group = 'Concepts & Ideas (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'complexity';
UPDATE general_english_vocab SET topic_group = 'Concepts & Ideas (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'constraint';
UPDATE general_english_vocab SET topic_group = 'Concepts & Ideas (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'darkness';
UPDATE general_english_vocab SET topic_group = 'Concepts & Ideas (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'hypothesis';
UPDATE general_english_vocab SET topic_group = 'Concepts & Ideas (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'logic';
UPDATE general_english_vocab SET topic_group = 'Concepts & Ideas (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'luxury';
UPDATE general_english_vocab SET topic_group = 'Concepts & Ideas (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'magic';
UPDATE general_english_vocab SET topic_group = 'Concepts & Ideas (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'mystery';
UPDATE general_english_vocab SET topic_group = 'Concepts & Ideas (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'probability';
UPDATE general_english_vocab SET topic_group = 'Concepts & Ideas (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'sake';
UPDATE general_english_vocab SET topic_group = 'Concepts & Ideas (Abstract Nouns)' WHERE cefr_level = 'C2' AND english_term = 'scope';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'distant';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'distinct';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'fancy';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'flexible';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'fortunate';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'gentle';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'genuine';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'golden';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'horrible';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'intense';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'mere';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'pale';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'raw';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'romantic';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'strict';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'tender';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'ugly';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'voluntary';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'wise';
UPDATE general_english_vocab SET topic_group = 'Descriptive Adjectives' WHERE cefr_level = 'C2' AND english_term = 'wooden';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'alongside';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'alright';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'altogether';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'barely';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'consequently';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'differently';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'faithfully';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'firmly';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'firstly';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'gently';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'hopefully';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'potentially';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'presumably';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'quietly';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'reasonably';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'regardless';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'subsequently';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'surprisingly';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'wherever';
UPDATE general_english_vocab SET topic_group = 'Adverbs & Conjunctions' WHERE cefr_level = 'C2' AND english_term = 'whilst';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'boom';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'bunch';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'castle';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'chamber';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'cluster';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'excess';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'fragment';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'harbor';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'interior';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'nowhere';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'rear';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'shelter';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'stake';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'storage';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'substitute';
UPDATE general_english_vocab SET topic_group = 'Structures & Quantities' WHERE cefr_level = 'C2' AND english_term = 'supplement';
UPDATE general_english_vocab SET topic_group = 'Social Issues & Roles' WHERE cefr_level = 'C2' AND english_term = 'abortion';
UPDATE general_english_vocab SET topic_group = 'Social Issues & Roles' WHERE cefr_level = 'C2' AND english_term = 'bias';
UPDATE general_english_vocab SET topic_group = 'Social Issues & Roles' WHERE cefr_level = 'C2' AND english_term = 'civilian';
UPDATE general_english_vocab SET topic_group = 'Social Issues & Roles' WHERE cefr_level = 'C2' AND english_term = 'controversial';
UPDATE general_english_vocab SET topic_group = 'Social Issues & Roles' WHERE cefr_level = 'C2' AND english_term = 'fool';
UPDATE general_english_vocab SET topic_group = 'Social Issues & Roles' WHERE cefr_level = 'C2' AND english_term = 'immigrant';
UPDATE general_english_vocab SET topic_group = 'Social Issues & Roles' WHERE cefr_level = 'C2' AND english_term = 'immigration';
UPDATE general_english_vocab SET topic_group = 'Social Issues & Roles' WHERE cefr_level = 'C2' AND english_term = 'racial';
UPDATE general_english_vocab SET topic_group = 'Social Issues & Roles' WHERE cefr_level = 'C2' AND english_term = 'refugee';
UPDATE general_english_vocab SET topic_group = 'Social Issues & Roles' WHERE cefr_level = 'C2' AND english_term = 'servant';
UPDATE general_english_vocab SET topic_group = 'Social Issues & Roles' WHERE cefr_level = 'C2' AND english_term = 'stranger';
UPDATE general_english_vocab SET topic_group = 'Social Issues & Roles' WHERE cefr_level = 'C2' AND english_term = 'veteran';
UPDATE general_english_vocab SET topic_group = 'Language & Literature' WHERE cefr_level = 'C2' AND english_term = 'catalog';
UPDATE general_english_vocab SET topic_group = 'Language & Literature' WHERE cefr_level = 'C2' AND english_term = 'fiction';
UPDATE general_english_vocab SET topic_group = 'Language & Literature' WHERE cefr_level = 'C2' AND english_term = 'grammar';
UPDATE general_english_vocab SET topic_group = 'Language & Literature' WHERE cefr_level = 'C2' AND english_term = 'narrative';
UPDATE general_english_vocab SET topic_group = 'Language & Literature' WHERE cefr_level = 'C2' AND english_term = 'noun';
UPDATE general_english_vocab SET topic_group = 'Language & Literature' WHERE cefr_level = 'C2' AND english_term = 'paragraph';
UPDATE general_english_vocab SET topic_group = 'Language & Literature' WHERE cefr_level = 'C2' AND english_term = 'poetry';
UPDATE general_english_vocab SET topic_group = 'Language & Literature' WHERE cefr_level = 'C2' AND english_term = 'tale';
UPDATE general_english_vocab SET topic_group = 'Language & Literature' WHERE cefr_level = 'C2' AND english_term = 'verb';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'autumn';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'carbon';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'cow';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'creature';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'liquid';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'moon';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'ocean';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'rat';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'rose';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'shade';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'sheep';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'shell';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'shore';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'slope';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'species';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'tail';
UPDATE general_english_vocab SET topic_group = 'Nature & Animals' WHERE cefr_level = 'C2' AND english_term = 'universe';
UPDATE general_english_vocab SET topic_group = 'Family & Relationships' WHERE cefr_level = 'C2' AND english_term = 'aunt';
UPDATE general_english_vocab SET topic_group = 'Family & Relationships' WHERE cefr_level = 'C2' AND english_term = 'cooperation';
UPDATE general_english_vocab SET topic_group = 'Family & Relationships' WHERE cefr_level = 'C2' AND english_term = 'grandmother';
UPDATE general_english_vocab SET topic_group = 'Family & Relationships' WHERE cefr_level = 'C2' AND english_term = 'listener';
UPDATE general_english_vocab SET topic_group = 'Family & Relationships' WHERE cefr_level = 'C2' AND english_term = 'lover';
UPDATE general_english_vocab SET topic_group = 'Family & Relationships' WHERE cefr_level = 'C2' AND english_term = 'maker';
UPDATE general_english_vocab SET topic_group = 'Family & Relationships' WHERE cefr_level = 'C2' AND english_term = 'partnership';
UPDATE general_english_vocab SET topic_group = 'Family & Relationships' WHERE cefr_level = 'C2' AND english_term = 'uncle';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'bell';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'belt';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'bin';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'carpet';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'clothing';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'curtain';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'fence';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'holder';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'hook';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'leather';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'shelf';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'stain';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'stair';
UPDATE general_english_vocab SET topic_group = 'Household & Materials' WHERE cefr_level = 'C2' AND english_term = 'tent';
UPDATE general_english_vocab SET topic_group = 'Arts, Sports & Entertainment' WHERE cefr_level = 'C2' AND english_term = 'athlete';
UPDATE general_english_vocab SET topic_group = 'Arts, Sports & Entertainment' WHERE cefr_level = 'C2' AND english_term = 'championship';
UPDATE general_english_vocab SET topic_group = 'Arts, Sports & Entertainment' WHERE cefr_level = 'C2' AND english_term = 'comedy';
UPDATE general_english_vocab SET topic_group = 'Arts, Sports & Entertainment' WHERE cefr_level = 'C2' AND english_term = 'craft';
UPDATE general_english_vocab SET topic_group = 'Arts, Sports & Entertainment' WHERE cefr_level = 'C2' AND english_term = 'guitar';
UPDATE general_english_vocab SET topic_group = 'Arts, Sports & Entertainment' WHERE cefr_level = 'C2' AND english_term = 'piano';
UPDATE general_english_vocab SET topic_group = 'Arts, Sports & Entertainment' WHERE cefr_level = 'C2' AND english_term = 'portrait';
UPDATE general_english_vocab SET topic_group = 'Arts, Sports & Entertainment' WHERE cefr_level = 'C2' AND english_term = 'pro';
UPDATE general_english_vocab SET topic_group = 'Arts, Sports & Entertainment' WHERE cefr_level = 'C2' AND english_term = 'tournament';
UPDATE general_english_vocab SET topic_group = 'Communication Acts' WHERE cefr_level = 'C2' AND english_term = 'allege';
UPDATE general_english_vocab SET topic_group = 'Communication Acts' WHERE cefr_level = 'C2' AND english_term = 'bless';
UPDATE general_english_vocab SET topic_group = 'Communication Acts' WHERE cefr_level = 'C2' AND english_term = 'chat';
UPDATE general_english_vocab SET topic_group = 'Communication Acts' WHERE cefr_level = 'C2' AND english_term = 'damn';
UPDATE general_english_vocab SET topic_group = 'Communication Acts' WHERE cefr_level = 'C2' AND english_term = 'greet';
UPDATE general_english_vocab SET topic_group = 'Communication Acts' WHERE cefr_level = 'C2' AND english_term = 'grin';
UPDATE general_english_vocab SET topic_group = 'Communication Acts' WHERE cefr_level = 'C2' AND english_term = 'hello';
UPDATE general_english_vocab SET topic_group = 'Communication Acts' WHERE cefr_level = 'C2' AND english_term = 'hint';
UPDATE general_english_vocab SET topic_group = 'Communication Acts' WHERE cefr_level = 'C2' AND english_term = 'reckon';
UPDATE general_english_vocab SET topic_group = 'Communication Acts' WHERE cefr_level = 'C2' AND english_term = 'sigh';
UPDATE general_english_vocab SET topic_group = 'Communication Acts' WHERE cefr_level = 'C2' AND english_term = 'swear';
UPDATE general_english_vocab SET topic_group = 'Communication Acts' WHERE cefr_level = 'C2' AND english_term = 'whisper';
UPDATE general_english_vocab SET topic_group = 'Technical & Conceptual Adjectives' WHERE cefr_level = 'C2' AND english_term = 'abstract';
UPDATE general_english_vocab SET topic_group = 'Technical & Conceptual Adjectives' WHERE cefr_level = 'C2' AND english_term = 'biological';
UPDATE general_english_vocab SET topic_group = 'Technical & Conceptual Adjectives' WHERE cefr_level = 'C2' AND english_term = 'concrete';
UPDATE general_english_vocab SET topic_group = 'Technical & Conceptual Adjectives' WHERE cefr_level = 'C2' AND english_term = 'continuous';
UPDATE general_english_vocab SET topic_group = 'Technical & Conceptual Adjectives' WHERE cefr_level = 'C2' AND english_term = 'experimental';
UPDATE general_english_vocab SET topic_group = 'Technical & Conceptual Adjectives' WHERE cefr_level = 'C2' AND english_term = 'functional';
UPDATE general_english_vocab SET topic_group = 'Technical & Conceptual Adjectives' WHERE cefr_level = 'C2' AND english_term = 'monthly';
UPDATE general_english_vocab SET topic_group = 'Technical & Conceptual Adjectives' WHERE cefr_level = 'C2' AND english_term = 'organic';
UPDATE general_english_vocab SET topic_group = 'Technical & Conceptual Adjectives' WHERE cefr_level = 'C2' AND english_term = 'precise';
UPDATE general_english_vocab SET topic_group = 'Technical & Conceptual Adjectives' WHERE cefr_level = 'C2' AND english_term = 'solar';
UPDATE general_english_vocab SET topic_group = 'Technical & Conceptual Adjectives' WHERE cefr_level = 'C2' AND english_term = 'structural';
UPDATE general_english_vocab SET topic_group = 'Technical & Conceptual Adjectives' WHERE cefr_level = 'C2' AND english_term = 'theoretical';
UPDATE general_english_vocab SET topic_group = 'Technical & Conceptual Adjectives' WHERE cefr_level = 'C2' AND english_term = 'weekly';
UPDATE general_english_vocab SET topic_group = 'Body & Health' WHERE cefr_level = 'C2' AND english_term = 'bite';
UPDATE general_english_vocab SET topic_group = 'Body & Health' WHERE cefr_level = 'C2' AND english_term = 'cheek';
UPDATE general_english_vocab SET topic_group = 'Body & Health' WHERE cefr_level = 'C2' AND english_term = 'cough';
UPDATE general_english_vocab SET topic_group = 'Body & Health' WHERE cefr_level = 'C2' AND english_term = 'insure';
UPDATE general_english_vocab SET topic_group = 'Body & Health' WHERE cefr_level = 'C2' AND english_term = 'nerve';
UPDATE general_english_vocab SET topic_group = 'Body & Health' WHERE cefr_level = 'C2' AND english_term = 'pregnancy';
UPDATE general_english_vocab SET topic_group = 'Body & Health' WHERE cefr_level = 'C2' AND english_term = 'stomach';
UPDATE general_english_vocab SET topic_group = 'Body & Health' WHERE cefr_level = 'C2' AND english_term = 'tissue';
UPDATE general_english_vocab SET topic_group = 'Body & Health' WHERE cefr_level = 'C2' AND english_term = 'tongue';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'compute';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'gaze';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'hesitate';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'hurry';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'pray';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'scan';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'shine';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'ski';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'snap';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'stimulate';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'stir';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'strengthen';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'trigger';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'unite';
UPDATE general_english_vocab SET topic_group = 'Verbs of Sensation & Influence' WHERE cefr_level = 'C2' AND english_term = 'wipe';
UPDATE general_english_vocab SET topic_group = 'Food & Drink' WHERE cefr_level = 'C2' AND english_term = 'cheese';
UPDATE general_english_vocab SET topic_group = 'Food & Drink' WHERE cefr_level = 'C2' AND english_term = 'chocolate';
UPDATE general_english_vocab SET topic_group = 'Food & Drink' WHERE cefr_level = 'C2' AND english_term = 'grain';
UPDATE general_english_vocab SET topic_group = 'Food & Drink' WHERE cefr_level = 'C2' AND english_term = 'menu';
UPDATE general_english_vocab SET topic_group = 'Food & Drink' WHERE cefr_level = 'C2' AND english_term = 'pot';
UPDATE general_english_vocab SET topic_group = 'Food & Drink' WHERE cefr_level = 'C2' AND english_term = 'potato';
UPDATE general_english_vocab SET topic_group = 'Food & Drink' WHERE cefr_level = 'C2' AND english_term = 'rice';
UPDATE general_english_vocab SET topic_group = 'Food & Drink' WHERE cefr_level = 'C2' AND english_term = 'slice';

-- Step 3: Verify the distribution
SELECT topic_group, COUNT(*) as word_count FROM general_english_vocab WHERE cefr_level = 'C2' GROUP BY topic_group ORDER BY word_count DESC;

-- Step 4: Check for any remaining NULL values
SELECT COUNT(*) as remaining_nulls FROM general_english_vocab WHERE cefr_level = 'C2' AND topic_group IS NULL;

-- Step 5: Check for duplicate assignments
SELECT english_term, COUNT(*) as assignment_count FROM general_english_vocab WHERE cefr_level = 'C2' AND topic_group IS NOT NULL GROUP BY english_term HAVING COUNT(*) > 1;

-- Step 6: Total word count
SELECT COUNT(*) as total_assigned_words FROM general_english_vocab WHERE cefr_level = 'C2' AND topic_group IS NOT NULL;

-- Step 7: Group size analysis
SELECT
    topic_group,
    COUNT(*) as word_count,
    CASE
        WHEN COUNT(*) < 3 THEN 'Small (< 3)'
        WHEN COUNT(*) < 10 THEN 'Medium (3-9)'
        WHEN COUNT(*) < 20 THEN 'Large (10-19)'
        ELSE 'Very Large (20+)'
    END as size_category
FROM general_english_vocab
WHERE cefr_level = 'C2' AND topic_group IS NOT NULL
GROUP BY topic_group
ORDER BY word_count DESC;
