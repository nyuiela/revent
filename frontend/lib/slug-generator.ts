/**
 * Generates a random alphanumeric slug
 * @param length - The length of the slug (default: 8)
 * @returns A random alphanumeric string
 */
export function generateSlug(length: number = 8): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Generates a unique slug with collision detection
 * @param length - The length of the slug (default: 8)
 * @param existingSlugs - Array of existing slugs to check against
 * @param maxAttempts - Maximum attempts to generate unique slug (default: 10)
 * @returns A unique random alphanumeric string
 */
export function generateUniqueSlug(
  length: number = 8, 
  existingSlugs: string[] = [], 
  maxAttempts: number = 10
): string {
  let attempts = 0;
  let slug = generateSlug(length);
  
  while (existingSlugs.includes(slug) && attempts < maxAttempts) {
    slug = generateSlug(length);
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    // If we can't generate a unique slug, append timestamp
    slug = generateSlug(length - 4) + Date.now().toString(36).slice(-4);
  }
  
  return slug;
}

/**
 * Validates if a string is a valid slug format
 * @param slug - The slug to validate
 * @param length - Expected length (default: 8)
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string, length: number = 8): boolean {
  const alphanumericRegex = /^[a-z0-9]+$/;
  return slug.length === length && alphanumericRegex.test(slug);
}
