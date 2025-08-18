/**
 * Utility helper functions for image generation
 */

/**
 * Generate a random color in hex format
 * Based on: https://stackoverflow.com/questions/1484506/random-color-generator
 */
export function getRandomColor(): string {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * Generate a random integer between min (inclusive) and max (exclusive)
 */
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Generate gradient color stops for backgrounds
 */
export function getGradientStops(stops: number): Record<number, string> {
  const gStop: Record<number, string> = {};
  const stopInc = parseFloat((1 / stops).toFixed(1));
  let initStop = 0;
  
  while (initStop < 1) {
    gStop[initStop] = getRandomColor();
    initStop += stopInc;
  }
  
  if (initStop !== 1) {
    gStop[1] = getRandomColor();
  }
  
  return gStop;
}

/**
 * Parse query parameters from URL
 */
export function parseQueryParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

/**
 * Validate and sanitize image dimensions
 */
export function validateDimensions(width: string | number, height: string | number): { w: number; h: number } {
  const w = Math.max(100, Math.min(2000, parseInt(String(width)) || 1200));
  const h = Math.max(100, Math.min(2000, parseInt(String(height)) || 630));
  
  return { w, h };
}

/**
 * Validate and sanitize color input
 */
export function validateColor(color: string): string {
  // Remove # if present and validate hex color
  const cleanColor = color.replace('#', '');
  
  if (/^[0-9A-F]{6}$/i.test(cleanColor)) {
    return `#${cleanColor}`;
  }
  
  // Return random color if invalid
  return getRandomColor();
}

/**
 * Create cache headers for responses
 */
export function createCacheHeaders(maxAge: number = 3600): Record<string, string> {
  return {
    'Cache-Control': `public, max-age=${maxAge}`,
    'Expires': new Date(Date.now() + maxAge * 1000).toUTCString(),
    'Pragma': 'no-cache'
  };
}

/**
 * Create no-cache headers for dynamic content
 */
export function createNoCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Expires': '-1',
    'Pragma': 'no-cache'
  };
}