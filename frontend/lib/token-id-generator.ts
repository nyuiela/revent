/**
 * Generates a 64-character hexadecimal token ID from a sequential number
 * This creates a padded hex representation of the token number
 * @param tokenNumber The sequential token number (starting from 1)
 * @returns 64-character hex string (e.g., "0000000000000000000000000000000000000000000000000000000000000001")
 */
export function generateTokenId(tokenNumber: number): string {
  if (tokenNumber < 1) {
    throw new Error('Token number must be >= 1');
  }

  // Convert to hex and pad to 64 characters
  const hexString = tokenNumber.toString(16);
  return hexString.padStart(64, '0');
}

/**
 * Generates a token ID from an event ID (for deterministic generation)
 * Converts the event ID to a number and creates a 64-char hex string
 */
export function generateTokenIdFromEventId(eventId: string): string {
  // Convert event ID to number (assuming it's a numeric string)
  const eventNumber = parseInt(eventId, 10);
  if (isNaN(eventNumber) || eventNumber < 1) {
    throw new Error('Event ID must be a valid number >= 1');
  }

  return generateTokenId(eventNumber);
}

/**
 * Validates if a string is a valid 64-character hexadecimal token ID
 */
export function isValidTokenId(tokenId: string): boolean {
  return typeof tokenId === 'string' && /^[0-9a-fA-F]{64}$/.test(tokenId);
}

/**
 * Converts a 64-character hex token ID back to its numeric value
 */
export function tokenIdToNumber(tokenId: string): number {
  if (!isValidTokenId(tokenId)) {
    throw new Error('Invalid token ID format');
  }

  return parseInt(tokenId, 16);
}
