
import { ENTITY_REGEX_VALIDATE } from '../constants/app';

export const isValidEntityId = (id: string): boolean => {
  return ENTITY_REGEX_VALIDATE.test(id.trim());
};

export const isValidFriendlyName = (name: string): boolean => {
  return name.trim().length >= 2;
};
