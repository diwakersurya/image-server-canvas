/**
 * Animated profile-banner endpoint for GitHub README embeds.
 */
import { SVGImageGenerator } from '../services/svg-image-generator';
import { validateDimensions } from '../utils/helpers';
import { getRandomGreeting } from '../utils/messages';

const DEFAULT_TAGLINES = [
  'Building at the intersection of web, cloud, and AI.',
  'Turning ideas into useful developer experiences.',
];

type Theme = 'aurora' | 'midnight' | 'sunrise';

interface ProfileParams {
  width: number;
  height: number;
  user: string;
  name: string;
  status: string;
  taglines: string[];
  theme: Theme;
  animated: boolean;
}

function textParam(value: string | null, fallback: string, maxLength: number): string {
  const text = value?.trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, maxLength) : fallback;
}

function parseTheme(value: string | null): Theme {
  return value === 'midnight' || value === 'sunrise' ? value : 'aurora';
}

function greetingWithoutPronunciation(message: string): string {
  return message.replace(/\s*\([^)]*\)\s*$/, '');
}

function parseProfileParams(url: URL): ProfileParams {
  const { w: width, h: height } = validateDimensions(
    url.searchParams.get('w') || '1200',
    url.searchParams.get('h') || '400',
  );
  const suppliedTaglines = (url.searchParams.get('taglines') || '')
    .split('|')
    .map((tagline) => textParam(tagline, '', 76))
    .filter(Boolean)
    .slice(0, 3);

  return {
    width,
    height,
    user: textParam(url.searchParams.get('user'), 'developer', 39),
    name: textParam(url.searchParams.get('name'), 'Diwaker Singh', 48),
    status: textParam(url.searchParams.get('status'), 'Currently crafting frontend @ SenseHQ', 58),
    taglines: suppliedTaglines.length > 0 ? suppliedTaglines : DEFAULT_TAGLINES,
    theme: parseTheme(url.searchParams.get('theme')),
    animated: url.searchParams.get('animated') !== 'false',
  };
}

export async function handleProfileEndpoint(request: Request): Promise<Response> {
  try {
    const params = parseProfileParams(new URL(request.url));
    const generator = new SVGImageGenerator(params.width, params.height);
    const greeting = getRandomGreeting();
    generator.drawProfileBanner({
      ...params,
      ...greeting,
      message: greetingWithoutPronunciation(greeting.message),
    });

    return new Response(generator.toSVG(), {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        // Generate a new language greeting each time the Worker is requested.
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating profile banner:', error);
    return new Response('Failed to generate profile banner', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
