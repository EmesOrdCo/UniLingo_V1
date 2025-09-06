// Onboarding constants and typed unions

export const languageOptions = [
  { code: 'en-GB', label: 'English (UK)', flagEmoji: '🇬🇧' },
  { code: 'es', label: 'Spanish', flagEmoji: '🇪🇸' },
  { code: 'de', label: 'German', flagEmoji: '🇩🇪' },
  { code: 'it', label: 'Italian', flagEmoji: '🇮🇹' },
  { code: 'fr', label: 'French', flagEmoji: '🇫🇷' },
  { code: 'pt', label: 'Portuguese', flagEmoji: '🇵🇹' },
  { code: 'sv', label: 'Swedish', flagEmoji: '🇸🇪' },
  { code: 'tr', label: 'Turkish', flagEmoji: '🇹🇷' },
] as const;

export const targetLanguageOptions = [
  { code: 'en-GB', label: 'English (UK)', flagEmoji: '🇬🇧' },
  { code: 'es', label: 'Spanish', flagEmoji: '🇪🇸' },
  { code: 'de', label: 'German', flagEmoji: '🇩🇪' },
  { code: 'it', label: 'Italian', flagEmoji: '🇮🇹' },
  { code: 'fr', label: 'French', flagEmoji: '🇫🇷' },
  { code: 'pt', label: 'Portuguese', flagEmoji: '🇵🇹' },
  { code: 'sv', label: 'Swedish', flagEmoji: '🇸🇪' },
  { code: 'tr', label: 'Turkish', flagEmoji: '🇹🇷' },
] as const;

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

