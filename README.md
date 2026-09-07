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

### `GET /profile`
Generates a compact animated SVG banner intended for a GitHub profile README.
It uses SMIL animation only, so it does not rely on JavaScript in the README.

**Query Parameters:**
- `user` - GitHub handle, without `@` (default: `developer`)
- `name` - Display name shown after the randomly selected multilingual greeting
- `status` - Short availability/status line
- `taglines` - Up to three taglines separated by `|`; they rotate every five seconds
- `theme` - `aurora` (default), `midnight`, or `sunrise`
- `animated` - Set to `false` for a static, accessible first frame
- `w`, `h` - Image dimensions (default: `1200×400`)

**GitHub README embed:**
```md
<img src="https://YOUR-WORKER.example/profile?user=diwakersurya&name=Diwaker%20Singh&status=Currently%20crafting%20frontend%20%40%20SenseHQ&taglines=Building%20with%20web%2C%20cloud%2C%20and%20AI.|Turning%20ideas%20into%20developer%20experiences.&theme=aurora" alt="Animated profile banner for Diwaker Singh" />
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