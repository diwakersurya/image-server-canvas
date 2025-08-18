/**
 * Simple image generation endpoint handler
 */

import { SVGImageGenerator } from '../services/svg-image-generator';
import { getRandomGreeting } from '../utils/messages';
import { parseQueryParams, validateDimensions, validateColor } from '../utils/helpers';

export interface SimpleImageParams {
  user: string;
  avatarUrl: string;
  backgroundColor: string;
  width: number;
  height: number;
}

/**
 * Parse and validate query parameters for simple image generation
 */
function parseImageParams(url: URL): SimpleImageParams {
  const params = parseQueryParams(url);
  
  const user = params.user || 'user';
  const avatarUrl = params.avatarUrl || `https://github.com/${user}.png`;
  const backgroundColor = validateColor(params.bg || '#' + Math.floor(Math.random()*16777215).toString(16));
  const { w: width, h: height } = validateDimensions(params.w || '1200', params.h || '630');

  return {
    user,
    avatarUrl,
    backgroundColor,
    width,
    height
  };
}

/**
 * Generate simple greeting image using SVG
 */
async function generateSimpleImage(params: SimpleImageParams): Promise<{ content: string; contentType: string }> {
  const { width, height, backgroundColor, user } = params;
  
  // Create SVG image generator
  const generator = new SVGImageGenerator(width, height);
  
  // Add drop shadow filter for text
  generator.addDropShadowFilter('textShadow', 2, 2, 4, 0.5);
  
  // Set background with gradient for better visual appeal
  const colors = [backgroundColor, adjustBrightness(backgroundColor, -20)];
  generator.setGradientBackground(colors, 'vertical');
  
  // Get random greeting
  const { language, message } = getRandomGreeting();
  
  // Calculate positions
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Draw main greeting text
  generator.drawText(message, centerX, centerY - 50, {
    fontSize: 70,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
    textAnchor: 'middle',
    dominantBaseline: 'middle',
    filter: 'url(#textShadow)'
  });
  
  // Draw language text
  generator.drawText(`(${language})`, centerX, centerY + 20, {
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 1,
    textAnchor: 'middle',
    dominantBaseline: 'middle',
    filter: 'url(#textShadow)'
  });
  
  // Draw user avatar placeholder (circular)
  const avatarRadius = 50;
  const avatarY = height - 150;
  generator.drawCircle(centerX, avatarY, avatarRadius, {
    fill: '#cccccc',
    stroke: '#ffffff',
    strokeWidth: 3
  });
  
  // Draw user icon in avatar circle
  generator.drawText('👤', centerX, avatarY, {
    fontSize: 40,
    textAnchor: 'middle',
    dominantBaseline: 'middle'
  });
  
  // Draw username
  generator.drawText(user, centerX, avatarY + 80, {
    fontSize: 30,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 1,
    textAnchor: 'middle',
    dominantBaseline: 'middle',
    filter: 'url(#textShadow)'
  });
  
  // Return SVG content
  return {
    content: generator.toSVG(),
    contentType: 'image/svg+xml'
  };
}

/**
 * Adjust color brightness
 */
function adjustBrightness(color: string, amount: number): string {
  // Simple brightness adjustment for hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const num = parseInt(hex, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
  return color;
}

/**
 * Handle /image endpoint
 */
export async function handleImageEndpoint(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const params = parseImageParams(url);
    
    // Generate image
    const { content, contentType } = await generateSimpleImage(params);
    
    // Create optimized response with appropriate caching
    const { createOptimizedResponse } = await import('../utils/performance');
    return createOptimizedResponse(content, contentType, false);
    
  } catch (error) {
    console.error('Error generating simple image:', error);
    
    return new Response('Failed to generate image', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}