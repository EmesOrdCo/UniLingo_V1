import { supabase } from './supabase';
import { SubjectLessonService } from './subjectLessonService';

export interface SubjectData {
  name: string; // Display name (translated)
  englishName?: string; // English name for database operations
  wordCount?: number;
  hasLessons?: boolean;
  cefrLevel?: string;
  orderIndex?: number;
}

export interface SubjectWordsData {
  id: number;
  english_translation: string;
  subject: string;
  french_translation?: string;
  spanish_translation?: string;
  german_translation?: string;
  chinese_simplified_translation?: string;
  hindi_translation?: string;
  example_sentence_english?: string;
  example_sentence_french?: string;
  example_sentence_spanish?: string;
  example_sentence_german?: string;
  example_sentence_chinese_simplified?: string;
  example_sentence_hindi?: string;
  cefr_level?: string;
}

export class SubjectDataService {
  private static cachedSubjects: string[] | null = null;
  private static cacheTimestamp: number | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Map UI language codes to database column names
   */
  private static getSubjectColumnName(language: string): string {
    const columnMap: { [key: string]: string } = {
      'en': 'subject',
      'de': 'subject_german',
      'fr': 'subject_french',
      'es': 'subject_spanish',
      'it': 'subject_italian',
      'zh': 'subject_chinese_simplified',
      'hi': 'subject_hindi'
    };
    
    return columnMap[language] || 'subject'; // Fallback to English
  }

  /**
   * Get all available subjects from database tables
   * Falls back to hardcoded subjects if database is unavailable
   */
  static async getAvailableSubjects(): Promise<string[]> {
    try {
      // Check cache first
      if (this.cachedSubjects && this.cacheTimestamp && 
          (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
        console.log('📚 Using cached subjects:', this.cachedSubjects.length);
        return this.cachedSubjects;
      }

      console.log('🔍 Fetching subjects from database...');

      // Get subjects from subject_words table
      const { data: subjectWordsData, error: wordsError } = await supabase
        .from('subject_words')
        .select('subject')
        .not('subject', 'is', null);

      if (wordsError) {
        console.warn('⚠️ Error fetching subjects from subject_words:', wordsError);
      }

      // Get subjects from lesson_scripts table
      const { data: lessonScriptsData, error: scriptsError } = await supabase
        .from('lesson_scripts')
        .select('subject_name')
        .not('subject_name', 'is', null);

      if (scriptsError) {
        console.warn('⚠️ Error fetching subjects from lesson_scripts:', scriptsError);
      }

      // Combine and deduplicate subjects
      const allSubjects = new Set<string>();
      
      if (subjectWordsData) {
        subjectWordsData.forEach(row => {
          if (row.subject) {
            allSubjects.add(row.subject);
          }
        });
      }

      if (lessonScriptsData) {
        lessonScriptsData.forEach(row => {
          if (row.subject_name) {
            allSubjects.add(row.subject_name);
          }
        });
      }

      const subjects = Array.from(allSubjects).sort();

      // Cache the results
      this.cachedSubjects = subjects;
      this.cacheTimestamp = Date.now();

      console.log(`✅ Found ${subjects.length} subjects in database:`, subjects.slice(0, 5), '...');

      return subjects;

    } catch (error) {
      console.error('❌ Error fetching subjects from database:', error);
      return this.getFallbackSubjects();
    }
  }

  /**
   * Get subjects with metadata for a specific CEFR level only
   * OPTIMIZED for fast initial load - only queries one CEFR level
   */
  static async getSubjectsForCefrLevel(cefrLevel: string, language: string = 'en'): Promise<SubjectData[]> {
    try {
      console.log(`🔍 Fetching subjects for CEFR level: ${cefrLevel} in ${language} (OPTIMIZED for speed)...`);
      const startTime = Date.now();

      // ALWAYS query using English subject names for database consistency
      // But also fetch the translated names for display
      const subjectColumn = this.getSubjectColumnName(language);
      const { data: wordData, error: wordError } = await supabase
        .from('subject_words')
        .select(`subject, ${subjectColumn}, cefr_level`)
        .eq('cefr_level', cefrLevel)
        .not('subject', 'is', null);

      if (wordError) {
        console.warn('⚠️ Error fetching word data:', wordError);
        return [];
      }

      // Get subjects with lessons for this CEFR level
      const { data: lessonData, error: lessonError } = await supabase
        .from('lesson_scripts')
        .select('subject_name, cefr_level, order_index')
        .eq('cefr_level', cefrLevel)
        .not('subject_name', 'is', null)
        .order('order_index', { ascending: true });

      if (lessonError) {
        console.warn('⚠️ Error fetching lesson data:', lessonError);
      }

      // Normalize subject names and track canonical names
      const normalizeSubjectName = (name: string): string => name.trim().toLowerCase();
      const canonicalNames: { [normalized: string]: string } = {};
      const subjectsWithLessons = new Set<string>();
      const orderIndexBySubject: { [normalized: string]: number } = {};

      // Process lesson data and store order_index
      // Note: lesson_scripts uses subject_name which should be English names
      if (lessonData) {
        lessonData.forEach(row => {
          if (row.subject_name) {
            const normalized = normalizeSubjectName(row.subject_name);
            if (!canonicalNames[normalized]) {
              canonicalNames[normalized] = row.subject_name.trim();
            }
            subjectsWithLessons.add(normalized);
            // Store the order_index for sorting later
            if (row.order_index !== null && row.order_index !== undefined) {
              orderIndexBySubject[normalized] = row.order_index;
            }
          }
        });
      }

      // Count words per subject for this CEFR level
      // Use English names for counting (database consistency) but store translated names for display
      const wordCountBySubject: { [englishName: string]: { count: number, translatedName: string } } = {};
      
      if (wordData) {
        wordData.forEach((row: any) => {
          const englishName = row.subject?.trim();
          const translatedName = row[subjectColumn]?.trim() || englishName; // Fallback to English if no translation
          
          if (englishName) {
            if (!wordCountBySubject[englishName]) {
              wordCountBySubject[englishName] = { count: 0, translatedName };
            }
            wordCountBySubject[englishName].count++;
          }
        });
      }

      // Build subjects array using translated names for display
      const subjectsWithMetadata: SubjectData[] = Object.entries(wordCountBySubject)
        .filter(([_, data]) => data.count > 0)
        .map(([englishName, data]) => {
          const englishNormalized = normalizeSubjectName(englishName);
          return {
            name: data.translatedName, // Display translated name
            englishName: englishName, // Store English name for database operations
            wordCount: data.count,
            hasLessons: Boolean(subjectsWithLessons.has(englishNormalized)), // Check against English name
            cefrLevel: String(cefrLevel).trim(),
            orderIndex: orderIndexBySubject[englishNormalized] // Use English name for order index
          };
        });

      // Sort by order_index (if available), otherwise by word count
      subjectsWithMetadata.sort((a, b) => {
        // If both have order_index, sort by that
        if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
          return a.orderIndex - b.orderIndex;
        }
        // If only one has order_index, prioritize it
        if (a.orderIndex !== undefined) return -1;
        if (b.orderIndex !== undefined) return 1;
        // Otherwise, sort by word count
        return (b.wordCount || 0) - (a.wordCount || 0);
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Found ${subjectsWithMetadata.length} subjects for ${cefrLevel} in ${duration}ms`);

      return subjectsWithMetadata;

    } catch (error) {
      console.error(`❌ Error fetching subjects for CEFR level ${cefrLevel}:`, error);
      return [];
    }
  }

  /**
   * Get subjects for a specific CEFR sub-level (e.g., A1.1, A2.3, B1.5)
   * OPTIMIZED for fast initial load - only queries one CEFR sub-level
   */
  static async getSubjectsForCefrSubLevel(cefrSubLevel: string, language: string = 'en'): Promise<SubjectData[]> {
    try {
      console.log(`🔍 Fetching subjects for CEFR sub-level: ${cefrSubLevel} in ${language} (OPTIMIZED for speed)...`);
      const startTime = Date.now();

      // Get subjects with lessons for this specific CEFR sub-level
      const { data: lessonData, error: lessonError } = await supabase
        .from('lesson_scripts')
        .select('subject_name, cefr_sub_level, order_index')
        .eq('cefr_sub_level', cefrSubLevel)
        .not('subject_name', 'is', null)
        .order('order_index', { ascending: true });

      if (lessonError) {
        console.warn('⚠️ Error fetching lesson data:', lessonError);
        return [];
      }

      if (!lessonData || lessonData.length === 0) {
        console.log(`⚠️ No lessons found for CEFR sub-level: ${cefrSubLevel}`);
        return [];
      }

      // Get word counts for these subjects from subject_words table
      const subjectColumn = this.getSubjectColumnName(language);
      const subjectNames = lessonData.map(row => row.subject_name).filter(Boolean);
      
      const { data: wordData, error: wordError } = await supabase
        .from('subject_words')
        .select(`subject, ${subjectColumn}, cefr_level`)
        .in('subject', subjectNames)
        .not('subject', 'is', null);

      if (wordError) {
        console.warn('⚠️ Error fetching word data:', wordError);
      }

      // Normalize subject names and track canonical names
      const normalizeSubjectName = (name: string): string => name.trim().toLowerCase();
      const canonicalNames: { [normalized: string]: string } = {};
      const subjectsWithLessons = new Set<string>();
      const orderIndexBySubject: { [normalized: string]: number } = {};

      // Process lesson data and store order_index
      lessonData.forEach(row => {
        if (row.subject_name) {
          const normalized = normalizeSubjectName(row.subject_name);
          if (!canonicalNames[normalized]) {
            canonicalNames[normalized] = row.subject_name.trim();
          }
          subjectsWithLessons.add(normalized);
          if (row.order_index !== null) {
            orderIndexBySubject[normalized] = row.order_index;
          }
        }
      });

      // Process word data and count words per subject
      const wordCountBySubject: { [englishName: string]: { count: number; translatedName: string } } = {};
      
      if (wordData) {
        wordData.forEach(row => {
          if (row.subject) {
            const englishName = row.subject.trim();
            const normalized = normalizeSubjectName(englishName);
            
            if (!canonicalNames[normalized]) {
              canonicalNames[normalized] = englishName;
            }
            
            if (!wordCountBySubject[englishName]) {
              wordCountBySubject[englishName] = {
                count: 0,
                translatedName: row[subjectColumn] || englishName
              };
            }
            wordCountBySubject[englishName].count++;
          }
        });
      }

      // Build subjects array using translated names for display
      const subjectsWithMetadata: SubjectData[] = Object.entries(wordCountBySubject)
        .filter(([_, data]) => data.count > 0)
        .map(([englishName, data]) => {
          const englishNormalized = normalizeSubjectName(englishName);
          return {
            name: data.translatedName, // Display translated name
            englishName: englishName, // Store English name for database operations
            wordCount: data.count,
            hasLessons: Boolean(subjectsWithLessons.has(englishNormalized)), // Check against English name
            cefrLevel: cefrSubLevel, // Use the specific sub-level
            orderIndex: orderIndexBySubject[englishNormalized] // Use English name for order index
          };
        });

      // Sort by order_index (if available), otherwise by word count
      subjectsWithMetadata.sort((a, b) => {
        // If both have order_index, sort by that
        if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
          return a.orderIndex - b.orderIndex;
        }
        // If only one has order_index, prioritize it
        if (a.orderIndex !== undefined) return -1;
        if (b.orderIndex !== undefined) return 1;
        // Otherwise, sort by word count
        return (b.wordCount || 0) - (a.wordCount || 0);
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Found ${subjectsWithMetadata.length} subjects for ${cefrSubLevel} in ${duration}ms`);

      return subjectsWithMetadata;

    } catch (error) {
      console.error(`❌ Error fetching subjects for CEFR sub-level ${cefrSubLevel}:`, error);
      return [];
    }
  }

  /**
   * Get subjects with additional metadata using the same counting logic as SubjectLessonService
   */
  static async getSubjectsWithAccurateCounts(language: string = 'en'): Promise<SubjectData[]> {
    try {
      console.log('🔍 Fetching subjects with accurate word counts using SubjectLessonService logic...');

      // Get all unique subject+CEFR combinations from database
      const { data: wordData, error: wordError } = await supabase
        .from('subject_words')
        .select('subject, cefr_level')
        .not('subject', 'is', null)
        .not('cefr_level', 'is', null);

      if (wordError) {
        console.warn('⚠️ Error fetching word data:', wordError);
        return this.getFallbackSubjects().map(name => ({
          name,
          englishName: name,
          wordCount: 0,
          hasLessons: false
        }));
      }

      // Get subjects with lessons
      const { data: lessonData, error: lessonError } = await supabase
        .from('lesson_scripts')
        .select('subject_name, cefr_level, order_index')
        .not('subject_name', 'is', null)
        .order('order_index', { ascending: true });

      if (lessonError) {
        console.warn('⚠️ Error fetching lesson data:', lessonError);
      }

      // Normalize subject names and track canonical names
      const normalizeSubjectName = (name: string): string => name.trim().toLowerCase();
      const canonicalNames: { [normalized: string]: string } = {};
      const subjectsWithLessons = new Set<string>();
      const orderIndexBySubject: { [key: string]: number } = {};

      // Process lesson data and store order_index
      if (lessonData) {
        lessonData.forEach(row => {
          if (row.subject_name) {
            const normalized = normalizeSubjectName(row.subject_name);
            const cefrLevel = String(row.cefr_level).trim();
            const key = `${normalized}|${cefrLevel}`;
            
            if (!canonicalNames[normalized]) {
              canonicalNames[normalized] = row.subject_name.trim();
            }
            subjectsWithLessons.add(normalized);
            
            // Store the order_index for this subject+CEFR combination
            if (row.order_index !== null && row.order_index !== undefined) {
              orderIndexBySubject[key] = row.order_index;
            }
          }
        });
      }

      // Get unique subject+CEFR combinations
      const subjectCefrCombos = new Set<string>();
      if (wordData) {
        wordData.forEach(row => {
          if (row.subject && row.cefr_level) {
            const normalized = normalizeSubjectName(row.subject);
            const cefrLevel = String(row.cefr_level).trim();
            
            if (!canonicalNames[normalized]) {
              canonicalNames[normalized] = row.subject.trim();
            }
            
            subjectCefrCombos.add(`${normalized}|${cefrLevel}`);
          }
        });
      }

      // For each combination, get accurate word count using same logic as SubjectLessonService
      const subjectsWithMetadata: SubjectData[] = [];
      
      for (const combo of subjectCefrCombos) {
        const [normalizedSubject, cefrLevel] = combo.split('|');
        const displayName = canonicalNames[normalizedSubject] || normalizedSubject;
        
        try {
          // Use exact same query as SubjectLessonService for accuracy
          const { data: vocabulary } = await supabase
            .from('subject_words')
            .select('*')
            .eq('subject', displayName)
            .eq('cefr_level', cefrLevel)
            .order('id', { ascending: true });

          const wordCount = vocabulary?.length || 0;
          const key = `${normalizedSubject}|${cefrLevel}`;
          
          if (wordCount > 0) {
            subjectsWithMetadata.push({
              name: String(displayName).trim(),
              wordCount: Number(wordCount),
              hasLessons: Boolean(subjectsWithLessons.has(normalizedSubject)),
              cefrLevel: String(cefrLevel).trim(),
              orderIndex: orderIndexBySubject[key]
            });
          }
        } catch (error) {
          console.warn(`⚠️ Error counting words for ${displayName} (${cefrLevel}):`, error);
        }
      }

      // Sort by order_index (if available), otherwise by word count
      subjectsWithMetadata.sort((a, b) => {
        // If both have order_index, sort by that
        if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
          return a.orderIndex - b.orderIndex;
        }
        // If only one has order_index, prioritize it
        if (a.orderIndex !== undefined) return -1;
        if (b.orderIndex !== undefined) return 1;
        // Otherwise, sort by word count
        return (b.wordCount || 0) - (a.wordCount || 0);
      });

      console.log(`✅ Found ${subjectsWithMetadata.length} subject+CEFR combinations with accurate word counts`);
      console.log('🔍 Top 5 by word count:', subjectsWithMetadata.slice(0, 5).map(s => ({ name: s.name, wordCount: s.wordCount, hasLessons: s.hasLessons, cefrLevel: s.cefrLevel })));

      return subjectsWithMetadata;

    } catch (error) {
      console.error('❌ Error fetching subjects with accurate counts:', error);
      return this.getFallbackSubjects().map(name => ({
        name,
        englishName: name,
        wordCount: 0,
        hasLessons: false
      }));
    }
  }

  /**
   * Get subjects with additional metadata (word count, lesson availability, CEFR level)
   */
  static async getSubjectsWithMetadata(language: string = 'en'): Promise<SubjectData[]> {
    try {
      console.log('🔍 Fetching subjects with metadata...');

      // Get word counts and CEFR levels per subject
      const { data: wordCounts, error: wordError } = await supabase
        .from('subject_words')
        .select('subject, cefr_level')
        .not('subject', 'is', null);

      if (wordError) {
        console.warn('⚠️ Error fetching word counts:', wordError);
      }

      // Get lesson availability and CEFR levels from lesson_scripts
      const { data: lessonData, error: lessonError } = await supabase
        .from('lesson_scripts')
        .select('subject_name, cefr_level')
        .not('subject_name', 'is', null);

      if (lessonError) {
        console.warn('⚠️ Error fetching lesson data:', lessonError);
      }

      // Normalize subject names (case-insensitive, trimmed)
      const normalizeSubjectName = (name: string): string => {
        return name.trim().toLowerCase();
      };

      // Track canonical names (first occurrence wins for display)
      const canonicalNames: { [normalized: string]: string } = {};
      
      // Count words per subject PER CEFR level
      // Key format: "normalizedSubject|cefrLevel"
      const subjectCefrWordCounts: { [key: string]: number } = {};
      const subjectCefrLevels: { [normalized: string]: string } = {};
      
      if (wordCounts) {
        wordCounts.forEach(row => {
          if (row.subject && row.cefr_level) {
            const normalized = normalizeSubjectName(row.subject);
            const cefrLevel = String(row.cefr_level).trim();
            
            // Store canonical name (first occurrence)
            if (!canonicalNames[normalized]) {
              canonicalNames[normalized] = row.subject.trim();
            }
            
            // Count words per subject+CEFR combination
            const key = `${normalized}|${cefrLevel}`;
            subjectCefrWordCounts[key] = (subjectCefrWordCounts[key] || 0) + 1;
            
            // Store the first CEFR level we find for this subject
            if (!subjectCefrLevels[normalized]) {
              subjectCefrLevels[normalized] = cefrLevel;
            }
          }
        });
      }

      // Get subjects with lessons and their CEFR levels
      const subjectsWithLessons = new Set<string>();
      if (lessonData) {
        lessonData.forEach(row => {
          if (row.subject_name) {
            const normalized = normalizeSubjectName(row.subject_name);
            // Store canonical name (first occurrence)
            if (!canonicalNames[normalized]) {
              canonicalNames[normalized] = row.subject_name.trim();
            }
            subjectsWithLessons.add(normalized);
            // Prefer CEFR level from lesson_scripts if available
            if (row.cefr_level) {
              subjectCefrLevels[normalized] = row.cefr_level;
            }
          }
        });
      }

      // Combine all unique subject+CEFR combinations
      const allSubjectCefrCombos = new Set<string>();
      Object.keys(subjectCefrWordCounts).forEach(key => allSubjectCefrCombos.add(key));
      
      // Also add subjects with lessons (they might not have words in subject_words)
      subjectsWithLessons.forEach(normalized => {
        const cefrLevel = subjectCefrLevels[normalized];
        if (cefrLevel) {
          allSubjectCefrCombos.add(`${normalized}|${cefrLevel}`);
        }
      });

      const subjectsWithMetadata: SubjectData[] = Array.from(allSubjectCefrCombos)
        .filter(combo => {
          // Safety check for combo
          if (!combo || typeof combo !== 'string' || combo.trim().length === 0) {
            console.warn('⚠️ Skipping invalid combo:', combo);
            return false;
          }
          return true;
        })
        .map(combo => {
          // Split the key back into subject and CEFR level
          const [normalizedSubject, cefrLevel] = combo.split('|');
          
          // Use canonical name for display
          const displayName = canonicalNames[normalizedSubject] || normalizedSubject;
          const wordCount = subjectCefrWordCounts[combo] || 0;
          
          return {
            name: String(displayName).trim(),
            wordCount: Number(wordCount),
            hasLessons: Boolean(subjectsWithLessons.has(normalizedSubject)),
            cefrLevel: cefrLevel ? String(cefrLevel).trim() : undefined
          };
        })
        .sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0)); // Sort by word count

      console.log(`✅ Found ${subjectsWithMetadata.length} subject+CEFR combinations with metadata`);
      console.log('🔍 Top 5 by word count:', subjectsWithMetadata.slice(0, 5).map(s => ({ name: s.name, wordCount: s.wordCount, hasLessons: s.hasLessons, cefrLevel: s.cefrLevel })));
      console.log('🔍 Sample combinations:', Object.entries(subjectCefrWordCounts).slice(0, 5));

      return subjectsWithMetadata;

    } catch (error) {
      console.error('❌ Error fetching subjects with metadata:', error);
      // Return fallback subjects as basic data
      return this.getFallbackSubjects().map(name => ({
        name,
        englishName: name,
        wordCount: 0,
        hasLessons: false
      }));
    }
  }

  /**
   * Get vocabulary words for a specific subject
   */
  static async getSubjectWords(subject: string, limit: number = 50): Promise<SubjectWordsData[]> {
    try {
      console.log(`🔍 Fetching words for subject: ${subject}`);

      const { data, error } = await supabase
        .from('subject_words')
        .select('*')
        .eq('subject', subject)
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`❌ Error fetching words for ${subject}:`, error);
        return [];
      }

      console.log(`✅ Found ${data?.length || 0} words for ${subject}`);
      return data || [];

    } catch (error) {
      console.error(`❌ Error fetching words for ${subject}:`, error);
      return [];
    }
  }

  /**
   * Get lesson script for a specific subject
   */
  static async getLessonScript(subject: string): Promise<any | null> {
    try {
      console.log(`🔍 Fetching lesson script for subject: ${subject}`);

      const { data, error } = await supabase
        .from('lesson_scripts')
        .select('*')
        .eq('subject_name', subject)
        .single();

      if (error) {
        console.error(`❌ Error fetching lesson script for ${subject}:`, error);
        return null;
      }

      console.log(`✅ Found lesson script for ${subject}`);
      return data;

    } catch (error) {
      console.error(`❌ Error fetching lesson script for ${subject}:`, error);
      return null;
    }
  }

  /**
   * Get subjects by CEFR level
   */
  static async getSubjectsByCEFRLevel(cefrLevel: string): Promise<string[]> {
    try {
      console.log(`🔍 Fetching subjects for CEFR level: ${cefrLevel}`);

      const { data, error } = await supabase
        .from('subject_words')
        .select('subject')
        .eq('cefr_level', cefrLevel)
        .not('subject', 'is', null);

      if (error) {
        console.error(`❌ Error fetching subjects for CEFR level ${cefrLevel}:`, error);
        return [];
      }

      const subjects = [...new Set(data?.map(row => row.subject) || [])].sort();
      console.log(`✅ Found ${subjects.length} subjects for CEFR level ${cefrLevel}`);
      return subjects;

    } catch (error) {
      console.error(`❌ Error fetching subjects for CEFR level ${cefrLevel}:`, error);
      return [];
    }
  }

  /**
   * Clear cache (useful for testing or when data changes)
   */
  static clearCache(): void {
    this.cachedSubjects = null;
    this.cacheTimestamp = null;
    console.log('🗑️ Subject data cache cleared');
  }

  /**
   * Fallback subjects when database is unavailable
   */
  private static getFallbackSubjects(): string[] {
    return [
      'Medicine',
      'Engineering', 
      'Physics',
      'Biology',
      'Chemistry',
      'Mathematics',
      'Computer Science',
      'Psychology',
      'Economics',
      'Law'
    ];
  }

  /**
   * Get popular subjects (subjects with most vocabulary)
   */
  static async getPopularSubjects(limit: number = 10, language: string = 'en'): Promise<SubjectData[]> {
    try {
      const subjectsWithMetadata = await this.getSubjectsWithMetadata(language);
      return subjectsWithMetadata.slice(0, limit);
    } catch (error) {
      console.error('❌ Error fetching popular subjects:', error);
      return this.getFallbackSubjects().slice(0, limit).map(name => ({
        name,
        englishName: name,
        wordCount: 0,
        hasLessons: false
      }));
    }
  }
}
