# Design Document

## Overview

This design outlines the migration of an Express.js greeting image generator to Cloudflare Workers. The migration involves replacing Node.js-specific libraries with Workers-compatible alternatives while maintaining the same API endpoints and functionality. The key challenge is replacing canvas-based image generation with solutions that work in the Workers runtime environment.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client        │───▶│ Cloudflare       │───▶│ GitHub API      │
│   Browser       │    │ Worker           │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ Image Generation │
                       │ (OffscreenCanvas │
                       │ or WASM)         │
                       └──────────────────┘
```

### Request Flow

1. **Static Content**: HTML, CSS, JS files served directly from Workers
2. **Image Generation**: Dynamic image creation using Workers-compatible libraries
3. **GitHub Integration**: Fetch user data from GitHub API using Workers fetch
4. **Response**: Return generated images with appropriate headers

## Components and Interfaces

### 1. Main Worker Handler

```typescript
interface WorkerRequest {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}

interface Env {
  // Environment variables for GitHub API, etc.
}
```

**Responsibilities:**
- Route incoming requests to appropriate handlers
- Serve static content
- Handle CORS and caching headers

### 2. Image Generation Service

```typescript
interface ImageGenerationService {
  generateSimpleGreeting(params: SimpleGreetingParams): Promise<ArrayBuffer>;
  generateGitHubGreeting(params: GitHubGreetingParams): Promise<ArrayBuffer>;
}

interface SimpleGreetingParams {
  user: string;
  avatarUrl: string;
  backgroundColor: string;
  width: number;
  height: number;
}

interface GitHubGreetingParams extends SimpleGreetingParams {
  userInfo: GitHubUserInfo;
}
```

**Implementation Options:**
1. **OffscreenCanvas API** (Preferred): Available in Workers runtime
2. **ImageMagick WASM**: For complex image operations
3. **Canvas API Polyfill**: WASM-based canvas implementation

### 3. GitHub API Service

```typescript
interface GitHubService {
  getUserInfo(username: string): Promise<GitHubUserInfo>;
}

interface GitHubUserInfo {
  login: string;
  avatar_url: string;
  name: string;
  company: string;
  location: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
}
```

### 4. Static Content Handler

```typescript
interface StaticContentHandler {
  serveFile(path: string): Promise<Response>;
  getContentType(filename: string): string;
}
```

### 5. Message Service

```typescript
interface MessageService {
  getRandomGreeting(): { language: string; message: string };
  getAllMessages(): Record<string, string>;
}
```

## Data Models

### Request/Response Models

```typescript
// Image endpoint query parameters
interface ImageQueryParams {
  user?: string;
  avatarUrl?: string;
  bg?: string;
  w?: string;
  h?: string;
}

// GitHub endpoint query parameters  
interface GitHubQueryParams extends ImageQueryParams {
  // Inherits all image parameters
}

// Response format
interface ImageResponse {
  body: ArrayBuffer;
  headers: {
    'Content-Type': 'image/png';
    'Cache-Control': string;
    'Expires': string;
    'Pragma': string;
  };
}
```

### Configuration Models

```typescript
interface WorkerConfig {
  defaultUser: string;
  defaultDimensions: {
    width: number;
    height: number;
  };
  cacheSettings: {
    maxAge: number;
    staleWhileRevalidate: number;
  };
}
```

## Error Handling

### Error Types

1. **GitHub API Errors**
   - Rate limiting (403)
   - User not found (404)
   - Network timeouts
   - Invalid responses

2. **Image Generation Errors**
   - Canvas initialization failures
   - Memory limitations
   - Invalid image parameters
   - Avatar loading failures

3. **Static Content Errors**
   - File not found
   - Invalid content types

### Error Response Strategy

```typescript
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

// Fallback strategies
const errorHandling = {
  githubApiFailure: 'Use default user info and cached avatar',
  imageGenerationFailure: 'Return simple text-based response',
  avatarLoadFailure: 'Use default placeholder avatar'
};
```

## Testing Strategy

### Unit Tests

1. **Image Generation Service**
   - Test parameter validation
   - Test image dimensions and format
   - Test color generation utilities
   - Test gradient creation

2. **GitHub Service**
   - Test API request formatting
   - Test response parsing
   - Test error handling
   - Mock API responses

3. **Static Content Handler**
   - Test content type detection
   - Test file serving
   - Test caching headers

### Integration Tests

1. **End-to-End Image Generation**
   - Test complete `/image` endpoint flow
   - Test complete `/github` endpoint flow
   - Test with various parameter combinations

2. **GitHub API Integration**
   - Test with real GitHub API (rate-limited)
   - Test error scenarios
   - Test caching behavior

### Performance Tests

1. **Image Generation Performance**
   - Measure generation time for different image sizes
   - Test memory usage
   - Test concurrent request handling

2. **Cold Start Performance**
   - Measure Worker initialization time
   - Test static asset loading

## Implementation Approach

### Phase 1: Basic Worker Setup
- Set up Cloudflare Workers project structure
- Configure wrangler.toml
- Implement basic routing
- Serve static content

### Phase 2: Simple Image Generation
- Implement OffscreenCanvas-based image generation
- Port the `/image` endpoint functionality
- Add basic text rendering and avatar loading

### Phase 3: Advanced Image Generation
- Implement gradient and styling features
- Port the `/github` endpoint functionality
- Add GitHub API integration

### Phase 4: Optimization and Polish
- Add caching strategies
- Optimize image generation performance
- Add comprehensive error handling
- Add monitoring and logging

## Technical Considerations

### Cloudflare Workers Limitations

1. **Memory**: 128MB limit per request
2. **CPU Time**: 50ms for free tier, 30s for paid
3. **Request Size**: 100MB limit
4. **No File System**: Must bundle assets or use KV storage

### Image Generation Strategy

**Primary Approach: OffscreenCanvas**
- Native Workers API support
- Good performance for basic operations
- Limited advanced features compared to Fabric.js

**Fallback Approach: WASM Canvas**
- More features but larger bundle size
- Potential performance overhead
- Better compatibility with existing canvas code

### Deployment Configuration

```toml
# wrangler.toml
name = "greeting-image-generator"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"

[vars]
ENVIRONMENT = "production"
```