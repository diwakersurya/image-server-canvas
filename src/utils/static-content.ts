/**
 * Static content serving utilities for Cloudflare Workers
 */

/**
 * Get content type based on file extension
 */
export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'html':
      return 'text/html; charset=utf-8';
    case 'css':
      return 'text/css; charset=utf-8';
    case 'js':
      return 'application/javascript; charset=utf-8';
    case 'json':
      return 'application/json; charset=utf-8';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'ico':
      return 'image/x-icon';
    default:
      return 'text/plain; charset=utf-8';
  }
}

/**
 * Add caching headers for static content
 */
export function addCacheHeaders(response: Response, maxAge: number = 3600): Response {
  response.headers.set('Cache-Control', `public, max-age=${maxAge}`);
  response.headers.set('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
  return response;
}

/**
 * Static file contents - bundled at build time
 */
export const STATIC_FILES: Record<string, string> = {
  '/style.css': `/* Greeting Image Generator Styles */

* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 2em 1em;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

header {
  text-align: center;
  margin-bottom: 2em;
}

h1 {
  color: white;
  font-size: 2.5em;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

main {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 2em;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

h2 {
  color: #667eea;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5em;
}

h3 {
  color: #764ba2;
  margin-top: 2em;
}

.endpoint-section {
  margin: 2em 0;
  padding: 1.5em;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.example {
  margin: 1em 0;
  padding: 1em;
  background: #e9ecef;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.example a {
  color: #667eea;
  text-decoration: none;
  word-break: break-all;
}

.example a:hover {
  text-decoration: underline;
}

.parameters {
  margin-top: 2em;
  padding: 1.5em;
  background: #fff3cd;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.parameters ul {
  margin: 0;
  padding-left: 1.5em;
}

.parameters li {
  margin: 0.5em 0;
}

code {
  background: #f1f3f4;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9em;
}

footer {
  text-align: center;
  margin-top: 3em;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

footer a {
  color: #ffc107;
  text-decoration: none;
}

footer a:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  body {
    padding: 1em 0.5em;
  }

  main {
    padding: 1.5em;
  }

  h1 {
    font-size: 2em;
  }

  .endpoint-section {
    padding: 1em;
  }
}`,

  '/script.js': `// Greeting Image Generator Client Script

console.log('Greeting Image Generator loaded');

// Add click tracking for examples
document.addEventListener('DOMContentLoaded', function() {
  const exampleLinks = document.querySelectorAll('.example a');

  exampleLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Add loading indicator
      const originalText = this.textContent;
      this.textContent = 'Loading...';

      // Reset text after a delay
      setTimeout(() => {
        this.textContent = originalText;
      }, 2000);
    });
  });

  // Add form for custom parameters (future enhancement)
  addCustomForm();
});

function addCustomForm() {
  const main = document.querySelector('main');

  const formSection = document.createElement('div');
  formSection.className = 'endpoint-section';
  formSection.innerHTML = \`
    <h3>Custom Image Generator</h3>
    <p>Generate a custom greeting image:</p>
    <form id="customForm" style="margin: 1em 0;">
      <div style="margin: 0.5em 0;">
        <label for="username">GitHub Username:</label>
        <input type="text" id="username" name="username" value="octocat" style="margin-left: 0.5em; padding: 0.3em;">
      </div>
      <div style="margin: 0.5em 0;">
        <label for="bgcolor">Background Color:</label>
        <input type="color" id="bgcolor" name="bgcolor" value="#ff6b6b" style="margin-left: 0.5em;">
      </div>
      <div style="margin: 0.5em 0;">
        <label for="endpoint">Endpoint:</label>
        <select id="endpoint" name="endpoint" style="margin-left: 0.5em; padding: 0.3em;">
          <option value="image">Simple Image</option>
          <option value="github">GitHub Profile</option>
        </select>
      </div>
      <button type="submit" style="margin-top: 1em; padding: 0.5em 1em; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Generate Image
      </button>
    </form>
    <div id="customResult" class="example" style="display: none;"></div>
  \`;

  main.appendChild(formSection);

  // Handle form submission
  document.getElementById('customForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value || 'octocat';
    const bgcolor = document.getElementById('bgcolor').value;
    const endpoint = document.getElementById('endpoint').value;

    const params = new URLSearchParams({
      user: username,
      bg: bgcolor
    });

    const url = \`/\${endpoint}?\${params.toString()}\`;

    const resultDiv = document.getElementById('customResult');
    resultDiv.innerHTML = \`<a href="\${url}" target="_blank">\${url}</a>\`;
    resultDiv.style.display = 'block';
  });
}`
};

/**
 * Serve static file content
 */
export async function serveStaticFile(path: string): Promise<Response | null> {
  const content = STATIC_FILES[path as keyof typeof STATIC_FILES];

  if (!content) {
    return null;
  }

  const contentType = getContentType(path);
  const response = new Response(content, {
    headers: { 'Content-Type': contentType }
  });

  // Add optimized caching for static assets
  const { createOptimizedCacheHeaders } = await import('./performance');
  const isStatic = path !== '/';
  const cacheHeaders = createOptimizedCacheHeaders(contentType, isStatic);

  Object.entries(cacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}