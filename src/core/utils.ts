import fs from 'node:fs';

export const toValidNpmPackageName = (input: string): string => {
  const validInput =
    input &&
    input.trim() &&
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');

  return validInput;
};
