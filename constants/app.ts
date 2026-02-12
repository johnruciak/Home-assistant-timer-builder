
export const TIMER_TARGET_DOMAINS = [
  'switch', 'light', 'valve', 'fan', 'climate', 'media_player', 'cover', 'vacuum'
] as const;

export const LIBRARY_DOMAINS = [
  ...TIMER_TARGET_DOMAINS, 'binary_sensor', 'sensor', 'input_boolean'
] as const;

export const ENTITY_REGEX_VALIDATE = new RegExp(
  `^(${LIBRARY_DOMAINS.join('|')})\\.[a-z0-9_]+$`, 
  'i'
);

export const ENTITY_REGEX_G = new RegExp(
  `\\b(${LIBRARY_DOMAINS.join('|')})\\.[a-z0-9_]+\\b`, 
  'gi'
);

export const MAX_TIMER_DURATION = 240;
export const MIN_TIMER_DURATION = 1;
export const DEFAULT_TIMER_DURATION = 30;
