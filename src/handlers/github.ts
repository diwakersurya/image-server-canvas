/**
 * GitHub greeting image endpoint handler
 */

import { SVGImageGenerator } from '../services/svg-image-generator';
import { githubService, GitHubUserInfo } from '../services/github';
import { parseQueryParams, validateDimensions } from '../utils/helpers';

export interface GitHubImageParams {
  user: string;
  width: number;
  height: number;
}

/**
 * Parse and validate query parameters for GitHub image generation
 */
function parseGitHubParams(url: URL): GitHubImageParams {
  const params = parseQueryParams(url);
  
  const user = params.user || 'user';
  const { w: width, h: height } = validateDimensions(params.w || '1200', params.h || '630');

  return {
    user,
    width,
    height
  };
}

/**
 * Generate GitHub greeting image with user profile data
 */
async function generateGitHubImage(params: GitHubImageParams): Promise<{ content: string; contentType: string }> {
  const { width, height, user } = params;
  
  // Fetch GitHub user info
  let userInfo: GitHubUserInfo;
  try {
    userInfo = await githubService.getUserInfo(user);
  } catch (error) {
    console.error('Failed to fetch GitHub user info:', error);
    // Use fallback user info
    userInfo = {
      login: user,
      id: 0,
      node_id: '',
      avatar_url: `https://github.com/${user}.png`,
      gravatar_id: '',
      url: '',
      html_url: `https://github.com/${user}`,
      followers_url: '',
      following_url: '',
      gists_url: '',
      starred_url: '',
      subscriptions_url: '',
      organizations_url: '',
      repos_url: '',
      events_url: '',
      received_events_url: '',
      type: 'User',
      site_admin: false,
      name: userInfo?.name || user,
      company: null,
      blog: '',
      location: null,
      email: null,
      hireable: null,
      bio: null,
      twitter_username: null,
      public_repos: 0,
      public_gists: 0,
      followers: 0,
      following: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  // Create SVG image generator
  const generator = new SVGImageGenerator(width, height);
  
  // Add drop shadow filter
  generator.addDropShadowFilter('textShadow', 3, 3, 6, 0.4);
  
  // Set gradient background
  const colors = ['#667eea', '#764ba2'];
  generator.setGradientBackground(colors, 'vertical');
  
  // Get random greeting
  const { getRandomGreeting } = await import('../utils/messages');
  const { language, message } = getRandomGreeting();
  
  // Calculate positions
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Draw main greeting text
  generator.drawText(message, centerX, centerY - 80, {
    fontSize: 60,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
    textAnchor: 'middle',
    dominantBaseline: 'middle',
    filter: 'url(#textShadow)'
  });
  
  // Draw language indicator
  generator.drawText(`--(${language})--`, centerX, centerY - 20, {
    fontSize: 20,
    fontFamily: 'Arial, sans-serif',
    fill: '#ffffff',
    textAnchor: 'middle',
    dominantBaseline: 'middle',
    filter: 'url(#textShadow)'
  });
  
  // Draw username with GitHub styling
  generator.drawText(userInfo.login, width - 200, 80, {
    fontSize: 30,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'normal',
    fill: '#03A87C',
    stroke: 'rgba(255, 255, 255, 0.5)',
    strokeWidth: 1,
    textAnchor: 'start',
    dominantBaseline: 'middle'
  });
  
  // Draw line under username
  generator.drawRectangle(50, 100, width - 280, 2, {
    fill: '#03A87C'
  });
  
  // Draw user stats if available
  if (userInfo.public_repos > 0 || userInfo.followers > 0) {
    generator.drawText(`${userInfo.public_repos} repos • ${userInfo.followers} followers`, 50, 140, {
      fontSize: 18,
      fontFamily: 'Arial, sans-serif',
      fill: '#ffffff',
      textAnchor: 'start',
      dominantBaseline: 'middle'
    });
  }
  
  // Draw avatar placeholder
  const avatarSize = 80;
  const avatarX = 50;
  const avatarY = 50;
  generator.drawRectangle(avatarX, avatarY, avatarSize, avatarSize, {
    fill: '#cccccc',
    stroke: '#ffffff',
    strokeWidth: 3,
    rx: 10
  });
  
  // Draw user icon in avatar
  generator.drawText('👤', avatarX + avatarSize/2, avatarY + avatarSize/2, {
    fontSize: 40,
    textAnchor: 'middle',
    dominantBaseline: 'middle'
  });
  
  return {
    content: generator.toSVG(),
    contentType: 'image/svg+xml'
  };
}

/**
 * Create fallback simple image when GitHub API fails
 */
async function generateFallbackImage(params: GitHubImageParams): Promise<{ content: string; contentType: string }> {
  const { width, height, user } = params;
  
  const { getRandomGreeting } = await import('../utils/messages');
  const { getRandomColor } = await import('../utils/helpers');
  
  const generator = new SVGImageGenerator(width, height);
  const backgroundColor = getRandomColor();
  
  // Add drop shadow filter
  generator.addDropShadowFilter('textShadow', 2, 2, 4, 0.5);
  
  // Set background
  generator.setBackground(backgroundColor);
  
  // Get random greeting
  const { language, message } = getRandomGreeting();
  
  // Calculate positions
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Draw fallback message
  generator.drawText('GitHub API Unavailable', centerX, centerY - 100, {
    fontSize: 40,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
    textAnchor: 'middle',
    dominantBaseline: 'middle',
    filter: 'url(#textShadow)'
  });
  
  // Draw greeting text
  generator.drawText(message, centerX, centerY - 20, {
    fontSize: 50,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
    textAnchor: 'middle',
    dominantBaseline: 'middle',
    filter: 'url(#textShadow)'
  });
  
  // Draw language
  generator.drawText(`(${language})`, centerX, centerY + 30, {
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 1,
    textAnchor: 'middle',
    dominantBaseline: 'middle'
  });
  
  // Draw username
  generator.drawText(user, centerX, centerY + 80, {
    fontSize: 30,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 1,
    textAnchor: 'middle',
    dominantBaseline: 'middle'
  });
  
  return {
    content: generator.toSVG(),
    contentType: 'image/svg+xml'
  };
}

/**
 * Handle /github endpoint
 */
export async function handleGitHubEndpoint(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const params = parseGitHubParams(url);
    
    let result: { content: string; contentType: string };
    
    try {
      // Try to generate advanced GitHub image
      result = await generateGitHubImage(params);
    } catch (error) {
      console.error('Advanced GitHub image generation failed, using fallback:', error);
      // Generate fallback image
      result = await generateFallbackImage(params);
    }
    
    // Create optimized response with appropriate caching
    const { createOptimizedResponse } = await import('../utils/performance');
    return createOptimizedResponse(result.content, result.contentType, false);
    
  } catch (error) {
    console.error('Error generating GitHub image:', error);
    
    return new Response('Failed to generate GitHub greeting image', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}