# Deployment Guide

This guide covers deploying the Greeting Image Generator to Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Node.js**: Version 18 or higher
3. **Wrangler CLI**: Cloudflare Workers CLI tool

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Wrangler CLI (if not already installed)

```bash
npm install -g wrangler
```

### 3. Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

### 4. Configure wrangler.toml

Update the `name` field in `wrangler.toml` to your desired Worker name:

```toml
name = "your-greeting-generator"  # Change this to your preferred name
```

## Development

### Local Development

Start the development server:

```bash
npm run dev
```

This will start a local server at `http://localhost:8787` with hot reloading.

### Testing Endpoints

Test the endpoints locally:

- **Root**: `http://localhost:8787/`
- **Simple Image**: `http://localhost:8787/image?user=octocat&bg=%23ff6b6b`
- **GitHub Image**: `http://localhost:8787/github?user=octocat`

## Deployment

### 1. Build the Project

```bash
npm run build
```

### 2. Deploy to Cloudflare Workers

```bash
npm run deploy
```

Or use Wrangler directly:

```bash
wrangler deploy
```

### 3. Verify Deployment

After deployment, Wrangler will provide a URL like:
```
https://your-greeting-generator.your-subdomain.workers.dev
```

Test the deployed endpoints:
- `https://your-greeting-generator.your-subdomain.workers.dev/`
- `https://your-greeting-generator.your-subdomain.workers.dev/image?user=octocat`
- `https://your-greeting-generator.your-subdomain.workers.dev/github?user=octocat`

## Environment Variables

### Setting Environment Variables

If you need to set environment variables (e.g., GitHub API tokens):

```bash
wrangler secret put GITHUB_TOKEN
```

Then update your `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "production"
# Add other non-secret variables here

# Secrets are managed separately via wrangler secret put
```

### Using Environment Variables in Code

Access environment variables in your Worker:

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const githubToken = env.GITHUB_TOKEN; // Secret
    const environment = env.ENVIRONMENT;  // Variable
    // ...
  },
};
```

## Custom Domain

### 1. Add Custom Domain

In the Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your Worker
3. Go to Settings > Triggers
4. Add Custom Domain

### 2. Update DNS

Add a CNAME record pointing to your Worker:
```
CNAME api your-greeting-generator.your-subdomain.workers.dev
```

## Monitoring and Logs

### View Logs

```bash
wrangler tail
```

### Analytics

View analytics in the Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your Worker
3. View the Analytics tab

## Performance Optimization

### 1. Bundle Size

Keep bundle size under 1MB for optimal performance:

```bash
# Check bundle size
ls -lh dist/index.js
```

### 2. Memory Usage

Monitor memory usage for image generation:
- Maximum image dimensions: 2000x2000 pixels
- Recommended: 1200x630 pixels for optimal performance

### 3. Caching

The application includes optimized caching:
- Static assets: 24 hours
- Generated images: 5 minutes
- API responses: No cache

## Troubleshooting

### Common Issues

1. **Bundle Size Too Large**
   ```bash
   # Optimize imports
   npm run build
   ```

2. **Memory Errors**
   - Reduce image dimensions
   - Check for memory leaks in image generation

3. **GitHub API Rate Limits**
   - Add GitHub API token as secret
   - Implement request caching

4. **OffscreenCanvas Not Supported**
   - Ensure compatibility_date is set correctly
   - Check browser compatibility

### Debug Mode

Enable debug logging by setting environment variable:

```toml
[vars]
DEBUG = "true"
```

### Performance Monitoring

Add performance monitoring:

```typescript
import { PerformanceMonitor } from './utils/performance';

const monitor = new PerformanceMonitor();
monitor.start('image-generation');
// ... image generation code
monitor.end('image-generation');
monitor.logMetrics();
```

## Security

### 1. CORS Configuration

CORS is configured to allow all origins. For production, consider restricting:

```typescript
// In src/index.ts
function addCorsHeaders(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com');
  // ...
}
```

### 2. Rate Limiting

Consider implementing rate limiting for production:

```typescript
// Example rate limiting logic
const rateLimiter = new Map();
const RATE_LIMIT = 100; // requests per minute
```

### 3. Input Validation

All inputs are validated and sanitized:
- Image dimensions are clamped to safe ranges
- Colors are validated as hex values
- Usernames are sanitized

## Scaling

### 1. Multiple Environments

Create separate Workers for different environments:

```bash
# Development
wrangler deploy --env development

# Staging  
wrangler deploy --env staging

# Production
wrangler deploy --env production
```

### 2. Load Testing

Test your Worker under load:

```bash
# Use tools like wrk or artillery
wrk -t12 -c400 -d30s https://your-worker.workers.dev/image?user=test
```

## Backup and Recovery

### 1. Code Backup

Ensure your code is backed up in version control (Git).

### 2. Configuration Backup

Export your Worker configuration:

```bash
wrangler whoami
wrangler kv:namespace list
```

### 3. Rollback

Rollback to previous version if needed:

```bash
wrangler rollback [deployment-id]
```

## Support

For issues and support:

1. Check [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
2. Review [GitHub Issues](https://github.com/your-repo/issues)
3. Contact support through Cloudflare dashboard