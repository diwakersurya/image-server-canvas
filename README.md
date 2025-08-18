# Greeting Image Generator - Cloudflare Workers

A dynamic greeting image generator that creates personalized greeting cards with GitHub user information, running on Cloudflare Workers.

## Features

- Generate greeting images with random multilingual messages
- Fetch GitHub user profiles and create enhanced greeting cards
- Fast global edge deployment via Cloudflare Workers
- No server maintenance required

## API Endpoints

### `GET /`
Serves the main HTML interface

### `GET /image`
Generates a simple greeting image

**Query Parameters:**
- `user` - GitHub username (default: "user")
- `avatarUrl` - Custom avatar URL (default: GitHub avatar)
- `bg` - Background color (default: random)
- `w` - Image width (default: 1200)
- `h` - Image height (default: 630)

**Example:**
```
/image?user=octocat&bg=%23ff6b6b&w=800&h=400
```

### `GET /github`
Generates an enhanced greeting image with GitHub profile data

**Query Parameters:** Same as `/image` endpoint

**Example:**
```
/github?user=octocat
```

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)

### Setup
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Deploy
```bash
npm run deploy
```

## Project Structure

```
├── src/
│   ├── index.ts          # Main Worker entry point
│   ├── handlers/         # Request handlers
│   ├── services/         # Business logic services
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
├── wrangler.toml        # Cloudflare Workers configuration
└── package.json
```

## Migration from Express.js

This project was migrated from an Express.js application to Cloudflare Workers. Key changes:

- Replaced `node-canvas` with OffscreenCanvas API
- Replaced `fabric.js` with custom canvas operations
- Converted CommonJS modules to ES modules
- Adapted static file serving for Workers environment
- Updated GitHub API integration for Workers fetch API

## License

MIT