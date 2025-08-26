/**
 * Simple greeting image endpoint handler
 */

import { SVGImageGenerator } from '../services/svg-image-generator';
import { parseQueryParams, validateDimensions, validateColor } from '../utils/helpers';

export interface GitHubImageParams {
  width: number;
  height: number;
  backgroundColor?: string;
  animated?: boolean;
  animateType?: 'color' | 'position' | 'opacity';
  textAnimation?: boolean;
}

/**
 * Parse and validate query parameters for GitHub image generation
 */
function parseGitHubParams(url: URL): GitHubImageParams {
  const params = parseQueryParams(url);

  const { w: width, h: height } = validateDimensions(params.w || '1200', params.h || '630');
  const backgroundColor = params.bg || '#' + Math.floor(Math.random()*16777215).toString(16);
  const animated = params.animated === 'true';
  const animateType = (params.animateType as 'color' | 'position' | 'opacity') || 'color';
  const textAnimation = params.textAnimation !== 'false';

  return {
    width,
    height,
    backgroundColor,
    animated,
    animateType,
    textAnimation
  };
}

/**
 * Generate simple greeting image with optional animations
 */
async function generateGitHubImage(params: GitHubImageParams): Promise<{ content: string; contentType: string }> {
  const { width, height, backgroundColor, animated, animateType, textAnimation } = params;
  
  // Create SVG image generator
  const generator = new SVGImageGenerator(width, height);

  // Add drop shadow filter for text
  generator.addDropShadowFilter('textShadow', 2, 2, 4, 0.5);

  // Set background - animated or static gradient
  if (animated) {
    // Generate random colors for animation
    const colors = [
      backgroundColor,
      '#' + Math.floor(Math.random()*16777215).toString(16),
      '#' + Math.floor(Math.random()*16777215).toString(16),
      adjustBrightness(backgroundColor, -20)
    ];

    generator.setAnimatedGradientBackground({
      colors,
      direction: 'diagonal',
      duration: 4,
      repeatCount: 'indefinite',
      animateType: animateType || 'color'
    });
  } else {
    // Static gradient background
    const colors = [backgroundColor, adjustBrightness(backgroundColor, -20)];
    generator.setGradientBackground(colors, 'vertical');
  }

  // Get random greeting
  const { getRandomGreeting } = await import('../utils/messages');
  const { language, message } = getRandomGreeting();

  // Calculate positions
  const centerX = width / 2;
  const centerY = height / 2;

  // Draw main greeting text - animated or static
  if (animated && textAnimation) {
    generator.drawAnimatedText(message, centerX, centerY - 50, {
      fontSize: 70,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      fill: '#ffffff',
      animation: {
        type: 'fadeIn',
        duration: 2,
        delay: 0.5,
        repeatCount: 1
      }
    });
  } else {
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
  }

  // Draw language text - animated or static
  if (animated && textAnimation) {
    generator.drawAnimatedText(`(${language})`, centerX, centerY + 20, {
      fontSize: 24,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      fill: '#ffffff',
      animation: {
        type: 'typewriter',
        duration: 2,
        delay: 1.5,
        repeatCount: 1
      }
    });
  } else {
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
  }

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
 * Create fallback simple image when needed
 */
async function generateFallbackImage(params: GitHubImageParams): Promise<{ content: string; contentType: string }> {
  // Just use the main image generation function as fallback
  return generateGitHubImage(params);
}

/**
 * Handle /github endpoint
 */
export async function handleGitHubEndpoint(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const params = parseGitHubParams(url);

    // Generate image
    const { content, contentType } = await generateGitHubImage(params);

    // Create optimized response with no caching for dynamic images
    const { createOptimizedResponse } = await import('../utils/performance');
    return createOptimizedResponse(content, contentType, false, {}, true);

  } catch (error) {
    console.error('Error generating GitHub image:', error);

    return new Response('Failed to generate image', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
