/**
 * Per-repo folder cards for READMEs.
 *
 * GitHub renders README images as <img>, so links inside an SVG never work.
 * Instead each card is its own image, wrapped in a markdown link:
 *   [![](/folder?user=x&n=0)](/folder/open?user=x&n=0)
 * `n` is the index into the user's most recently pushed repos, so the
 * README stays static while the cards follow the latest projects.
 */

import { getRecentRepos, GitHubRepo } from '../services/github';

const MAX_CARDS = 6;
const WIDTH = 400;
const HEIGHT = 140;

// ponytail: small subset of GitHub linguist colors, gray fallback for the rest
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Swift: '#F05138',
  Kotlin: '#A97BFF'
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

/**
 * Read and validate `user` and `n` query params
 */
function parseParams(url: URL): { user: string; n: number } | null {
  const user = url.searchParams.get('user') || '';
  const n = Number(url.searchParams.get('n') || '0');
  // GitHub usernames: alphanumeric + hyphen, max 39 chars
  if (!/^[A-Za-z0-9-]{1,39}$/.test(user)) return null;
  if (!Number.isInteger(n) || n < 0 || n >= MAX_CARDS) return null;
  return { user, n };
}

function renderFolderCard(repo: GitHubRepo | undefined, n: number): string {
  const name = repo ? escapeXml(truncate(repo.name, 28)) : 'No project yet';
  const description = repo ? escapeXml(truncate(repo.description || 'No description', 48)) : '';
  const language = repo?.language ? escapeXml(repo.language) : '';
  const languageColor = (repo?.language && LANGUAGE_COLORS[repo.language]) || '#8b949e';
  const stars = repo ? `★ ${repo.stargazers_count}` : '';
  // Stagger cards so a row of them animates in sequence
  const delay = (n * 0.15).toFixed(2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <style>
    .card { opacity: 0; animation: fadeIn 0.6s ease-out ${delay}s forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    text { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; }
  </style>
  <g class="card">
    <rect x="1" y="1" width="${WIDTH - 2}" height="${HEIGHT - 2}" rx="10" fill="#0d1117" stroke="#30363d"/>
    <g transform="translate(20 28)">
      <path d="M0 6a6 6 0 0 1 6-6h22l8 9h34a6 6 0 0 1 6 6v49a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6z" fill="#e3b341"/>
      <path d="M0 18h76v46a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6z" fill="#f2cc60"/>
    </g>
    <text x="116" y="50" font-size="18" font-weight="600" fill="#58a6ff">${name}</text>
    <text x="116" y="76" font-size="13" fill="#8b949e">${description}</text>
    ${language ? `<circle cx="122" cy="103" r="6" fill="${languageColor}"/>
    <text x="134" y="108" font-size="13" fill="#c9d1d9">${language}</text>` : ''}
    <text x="${WIDTH - 20}" y="108" font-size="13" fill="#c9d1d9" text-anchor="end">${stars}</text>
  </g>
</svg>`;
}

/**
 * GET /folder?user=x&n=0 — SVG card for the nth most recent repo
 */
export async function handleFolderEndpoint(request: Request, token?: string): Promise<Response> {
  const params = parseParams(new URL(request.url));
  if (!params) {
    return new Response(`Expected ?user=<github user>&n=<0-${MAX_CARDS - 1}>`, { status: 400 });
  }

  let repo: GitHubRepo | undefined;
  try {
    repo = (await getRecentRepos(params.user, MAX_CARDS, token))[params.n];
  } catch (error) {
    // Graceful degradation: render an empty card rather than a broken image
    console.error('Error fetching repos:', error);
  }

  return new Response(renderFolderCard(repo, params.n), {
    headers: {
      'Content-Type': 'image/svg+xml',
      // GitHub's camo proxy respects this; keeps cards fresh without hammering the API
      'Cache-Control': 'public, max-age=1800'
    }
  });
}

/**
 * GET /folder/open?user=x&n=0 — redirect to the nth most recent repo
 */
export async function handleFolderOpenEndpoint(request: Request, token?: string): Promise<Response> {
  const params = parseParams(new URL(request.url));
  if (!params) {
    return new Response(`Expected ?user=<github user>&n=<0-${MAX_CARDS - 1}>`, { status: 400 });
  }

  let target = `https://github.com/${params.user}?tab=repositories`;
  try {
    const repo = (await getRecentRepos(params.user, MAX_CARDS, token))[params.n];
    if (repo) target = repo.html_url;
  } catch (error) {
    console.error('Error fetching repos:', error);
  }

  return Response.redirect(target, 302);
}
