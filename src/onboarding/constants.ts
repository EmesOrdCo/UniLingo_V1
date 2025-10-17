// Onboarding constants and typed unions

// Comprehensive list of supported languages
export const languageOptions = [
  { code: 'af', label: 'Afrikaans', flagEmoji: '🇿🇦', highlighted: false },
  { code: 'sq', label: 'Albanian', flagEmoji: '🇦🇱', highlighted: false },
  { code: 'am', label: 'Amharic', flagEmoji: '🇪🇹', highlighted: false },
  { code: 'ar', label: 'Arabic', flagEmoji: '🇸🇦', highlighted: false },
  { code: 'hy', label: 'Armenian', flagEmoji: '🇦🇲', highlighted: false },
  { code: 'az', label: 'Azerbaijani', flagEmoji: '🇦🇿', highlighted: false },
  { code: 'eu', label: 'Basque', flagEmoji: '🇪🇸', highlighted: false },
  { code: 'be', label: 'Belarusian', flagEmoji: '🇧🇾', highlighted: false },
  { code: 'bn', label: 'Bengali', flagEmoji: '🇧🇩', highlighted: false },
  { code: 'bs', label: 'Bosnian', flagEmoji: '🇧🇦', highlighted: false },
  { code: 'bg', label: 'Bulgarian', flagEmoji: '🇧🇬', highlighted: false },
  { code: 'ca', label: 'Catalan', flagEmoji: '🇪🇸', highlighted: false },
  { code: 'ceb', label: 'Cebuano', flagEmoji: '🇵🇭', highlighted: false },
  { code: 'ny', label: 'Chichewa', flagEmoji: '🇲🇼', highlighted: false },
  { code: 'zh', label: 'Chinese (Simplified)', flagEmoji: '🇨🇳', highlighted: true },
  { code: 'zh-tw', label: 'Chinese (Traditional)', flagEmoji: '🇹🇼', highlighted: true },
  { code: 'co', label: 'Corsican', flagEmoji: '🇫🇷', highlighted: false },
  { code: 'hr', label: 'Croatian', flagEmoji: '🇭🇷', highlighted: false },
  { code: 'cs', label: 'Czech', flagEmoji: '🇨🇿', highlighted: false },
  { code: 'da', label: 'Danish', flagEmoji: '🇩🇰', highlighted: false },
  { code: 'nl', label: 'Dutch', flagEmoji: '🇳🇱', highlighted: false },
  { code: 'en', label: 'English', flagEmoji: '🇺🇸', highlighted: true },
  { code: 'eo', label: 'Esperanto', flagEmoji: '🌍', highlighted: false },
  { code: 'et', label: 'Estonian', flagEmoji: '🇪🇪', highlighted: false },
  { code: 'tl', label: 'Filipino', flagEmoji: '🇵🇭', highlighted: false },
  { code: 'fi', label: 'Finnish', flagEmoji: '🇫🇮', highlighted: false },
  { code: 'fr', label: 'French', flagEmoji: '🇫🇷', highlighted: true },
  { code: 'fy', label: 'Frisian', flagEmoji: '🇳🇱', highlighted: false },
  { code: 'gl', label: 'Galician', flagEmoji: '🇪🇸', highlighted: false },
  { code: 'ka', label: 'Georgian', flagEmoji: '🇬🇪', highlighted: false },
  { code: 'de', label: 'German', flagEmoji: '🇩🇪', highlighted: true },
  { code: 'el', label: 'Greek', flagEmoji: '🇬🇷', highlighted: false },
  { code: 'gu', label: 'Gujarati', flagEmoji: '🇮🇳', highlighted: false },
  { code: 'ht', label: 'Haitian Creole', flagEmoji: '🇭🇹', highlighted: false },
  { code: 'ha', label: 'Hausa', flagEmoji: '🇳🇬', highlighted: false },
  { code: 'haw', label: 'Hawaiian', flagEmoji: '🇺🇸', highlighted: false },
  { code: 'iw', label: 'Hebrew', flagEmoji: '🇮🇱', highlighted: false },
  { code: 'hi', label: 'Hindi', flagEmoji: '🇮🇳', highlighted: true },
  { code: 'hmn', label: 'Hmong', flagEmoji: '🇱🇦', highlighted: false },
  { code: 'hu', label: 'Hungarian', flagEmoji: '🇭🇺', highlighted: false },
  { code: 'is', label: 'Icelandic', flagEmoji: '🇮🇸', highlighted: false },
  { code: 'ig', label: 'Igbo', flagEmoji: '🇳🇬', highlighted: false },
  { code: 'id', label: 'Indonesian', flagEmoji: '🇮🇩', highlighted: false },
  { code: 'ga', label: 'Irish', flagEmoji: '🇮🇪', highlighted: false },
  { code: 'it', label: 'Italian', flagEmoji: '🇮🇹', highlighted: false },
  { code: 'ja', label: 'Japanese', flagEmoji: '🇯🇵', highlighted: false },
  { code: 'jw', label: 'Javanese', flagEmoji: '🇮🇩', highlighted: false },
  { code: 'kn', label: 'Kannada', flagEmoji: '🇮🇳', highlighted: false },
  { code: 'kk', label: 'Kazakh', flagEmoji: '🇰🇿', highlighted: false },
  { code: 'km', label: 'Khmer', flagEmoji: '🇰🇭', highlighted: false },
  { code: 'ko', label: 'Korean', flagEmoji: '🇰🇷', highlighted: false },
  { code: 'ku', label: 'Kurdish (Kurmanji)', flagEmoji: '🇮🇶', highlighted: false },
  { code: 'ky', label: 'Kyrgyz', flagEmoji: '🇰🇬', highlighted: false },
  { code: 'lo', label: 'Lao', flagEmoji: '🇱🇦', highlighted: false },
  { code: 'la', label: 'Latin', flagEmoji: '🏛️', highlighted: false },
  { code: 'lv', label: 'Latvian', flagEmoji: '🇱🇻', highlighted: false },
  { code: 'lt', label: 'Lithuanian', flagEmoji: '🇱🇹', highlighted: false },
  { code: 'lb', label: 'Luxembourgish', flagEmoji: '🇱🇺', highlighted: false },
  { code: 'mk', label: 'Macedonian', flagEmoji: '🇲🇰', highlighted: false },
  { code: 'mg', label: 'Malagasy', flagEmoji: '🇲🇬', highlighted: false },
  { code: 'ms', label: 'Malay', flagEmoji: '🇲🇾', highlighted: false },
  { code: 'ml', label: 'Malayalam', flagEmoji: '🇮🇳', highlighted: false },
  { code: 'mt', label: 'Maltese', flagEmoji: '🇲🇹', highlighted: false },
  { code: 'mi', label: 'Maori', flagEmoji: '🇳🇿', highlighted: false },
  { code: 'mr', label: 'Marathi', flagEmoji: '🇮🇳', highlighted: false },
  { code: 'mn', label: 'Mongolian', flagEmoji: '🇲🇳', highlighted: false },
  { code: 'my', label: 'Myanmar (Burmese)', flagEmoji: '🇲🇲', highlighted: false },
  { code: 'ne', label: 'Nepali', flagEmoji: '🇳🇵', highlighted: false },
  { code: 'no', label: 'Norwegian', flagEmoji: '🇳🇴', highlighted: false },
  { code: 'ps', label: 'Pashto', flagEmoji: '🇦🇫', highlighted: false },
  { code: 'fa', label: 'Persian', flagEmoji: '🇮🇷', highlighted: false },
  { code: 'pl', label: 'Polish', flagEmoji: '🇵🇱', highlighted: false },
  { code: 'pt', label: 'Portuguese', flagEmoji: '🇵🇹', highlighted: false },
  { code: 'pa', label: 'Punjabi', flagEmoji: '🇮🇳', highlighted: false },
  { code: 'ro', label: 'Romanian', flagEmoji: '🇷🇴', highlighted: false },
  { code: 'ru', label: 'Russian', flagEmoji: '🇷🇺', highlighted: false },
  { code: 'sm', label: 'Samoan', flagEmoji: '🇼🇸', highlighted: false },
  { code: 'gd', label: 'Scots Gaelic', flagEmoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', highlighted: false },
  { code: 'sr', label: 'Serbian', flagEmoji: '🇷🇸', highlighted: false },
  { code: 'st', label: 'Sesotho', flagEmoji: '🇱🇸', highlighted: false },
  { code: 'sn', label: 'Shona', flagEmoji: '🇿🇼', highlighted: false },
  { code: 'sd', label: 'Sindhi', flagEmoji: '🇵🇰', highlighted: false },
  { code: 'si', label: 'Sinhala', flagEmoji: '🇱🇰', highlighted: false },
  { code: 'sk', label: 'Slovak', flagEmoji: '🇸🇰', highlighted: false },
  { code: 'sl', label: 'Slovenian', flagEmoji: '🇸🇮', highlighted: false },
  { code: 'so', label: 'Somali', flagEmoji: '🇸🇴', highlighted: false },
  { code: 'es', label: 'Spanish', flagEmoji: '🇪🇸', highlighted: true },
  { code: 'su', label: 'Sundanese', flagEmoji: '🇮🇩', highlighted: false },
  { code: 'sw', label: 'Swahili', flagEmoji: '🇰🇪', highlighted: false },
  { code: 'sv', label: 'Swedish', flagEmoji: '🇸🇪', highlighted: false },
  { code: 'tg', label: 'Tajik', flagEmoji: '🇹🇯', highlighted: false },
  { code: 'ta', label: 'Tamil', flagEmoji: '🇮🇳', highlighted: false },
  { code: 'tt', label: 'Tatar', flagEmoji: '🇷🇺', highlighted: false },
  { code: 'te', label: 'Telugu', flagEmoji: '🇮🇳', highlighted: false },
  { code: 'th', label: 'Thai', flagEmoji: '🇹🇭', highlighted: false },
  { code: 'tr', label: 'Turkish', flagEmoji: '🇹🇷', highlighted: false },
  { code: 'tk', label: 'Turkmen', flagEmoji: '🇹🇲', highlighted: false },
  { code: 'uk', label: 'Ukrainian', flagEmoji: '🇺🇦', highlighted: false },
  { code: 'ur', label: 'Urdu', flagEmoji: '🇵🇰', highlighted: false },
  { code: 'ug', label: 'Uyghur', flagEmoji: '🇨🇳', highlighted: false },
  { code: 'uz', label: 'Uzbek', flagEmoji: '🇺🇿', highlighted: false },
  { code: 'vi', label: 'Vietnamese', flagEmoji: '🇻🇳', highlighted: false },
  { code: 'cy', label: 'Welsh', flagEmoji: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', highlighted: false },
  { code: 'xh', label: 'Xhosa', flagEmoji: '🇿🇦', highlighted: false },
  { code: 'yi', label: 'Yiddish', flagEmoji: '🇮🇱', highlighted: false },
  { code: 'yo', label: 'Yoruba', flagEmoji: '🇳🇬', highlighted: false },
  { code: 'zu', label: 'Zulu', flagEmoji: '🇿🇦', highlighted: false },
] as const;

export const targetLanguageOptions = languageOptions;

export const goals = [
  { key: 'presentations', label: 'Give presentations' },
  { key: 'culture', label: 'Understand culture' },
  { key: 'navigate', label: 'Navigate while traveling' },
  { key: 'read', label: 'Read books and articles' },
  { key: 'adapt', label: 'Adapt to new environments' },
  { key: 'write', label: 'Write professionally' },
  { key: 'watch', label: 'Watch movies and shows' },
  { key: 'converse', label: 'Have conversations' },
  { key: 'listen', label: 'Listen to podcasts and music' },
] as const;

export const proficiencyOptions = [
  { key: 'none', label: 'I don\'t know any' },
  { key: 'basic', label: 'I know the basics' },
  { key: 'advanced', label: 'I\'m advanced' },
] as const;

export const commitmentOptions = [
  { key: '5', label: '5 min / day' },
  { key: '15', label: '15 min / day' },
  { key: '30', label: '30 min / day' },
  { key: '60', label: '1 hour / day' },
] as const;

export const ageRanges = [
  { key: 'under_18', label: 'Under 18' },
  { key: '18_24', label: '18-24' },
  { key: '25_34', label: '25-34' },
  { key: '35_44', label: '35-44' },
  { key: '45_54', label: '45-54' },
  { key: '55_64', label: '55-64' },
  { key: '65_plus', label: '65+' },
] as const;

export const discoveryOptions = [
  { key: 'facebook_instagram', label: 'Facebook or Instagram' },
  { key: 'search', label: 'Search engine' },
  { key: 'podcast', label: 'Podcast' },
  { key: 'tv', label: 'TV or streaming' },
  { key: 'friends_family', label: 'Friends or family' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'app_store', label: 'App Store' },
  { key: 'website_ad', label: 'Website advertisement' },
  { key: 'radio', label: 'Radio' },
  { key: 'other', label: 'Other' },
] as const;

// Typed unions
export type LanguageCode = typeof languageOptions[number]['code'];
export type TargetLanguageCode = typeof targetLanguageOptions[number]['code'];
export type GoalKey = typeof goals[number]['key'];
export type ProficiencyLevel = typeof proficiencyOptions[number]['key'];
export type TimeCommitment = typeof commitmentOptions[number]['key'];
export type AgeRange = typeof ageRanges[number]['key'];
export type DiscoverySource = typeof discoveryOptions[number]['key'];

// Helper types for form data
export type LanguageOption = typeof languageOptions[number];
export type TargetLanguageOption = typeof targetLanguageOptions[number];
export type GoalOption = typeof goals[number];
export type ProficiencyOption = typeof proficiencyOptions[number];
export type CommitmentOption = typeof commitmentOptions[number];
export type AgeRangeOption = typeof ageRanges[number];
export type DiscoveryOption = typeof discoveryOptions[number];

// Helper function to get highlighted languages
export const getHighlightedLanguages = () => languageOptions.filter(lang => lang.highlighted);

