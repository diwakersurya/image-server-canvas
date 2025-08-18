# Design Document

## Overview

The HTML content-type issue stems from improper header handling in the response middleware chain. The current implementation correctly sets the `Content-Type: text/html; charset=utf-8` header in the static content handler, but this header is being lost or overridden when CORS and security headers are applied in the main request handler.

The root cause is in the `addCorsHeaders` function which creates a new Response object but doesn't properly preserve all original headers, and the `addSecurityHeaders` function which mutates the response object directly, potentially causing header conflicts.

## Architecture

The fix involves restructuring the response header handling to ensure content-type headers are preserved throughout the middleware chain:

```
Request → Router → Static Content Handler → Header Middleware → Response
                                         ↓
                              Preserve Content-Type Headers
```

### Current Flow (Problematic)
1. Static content handler sets `Content-Type: text/html`
2. `addCorsHeaders` creates new Response, potentially losing headers
3. `addSecurityHeaders` modifies headers directly
4. Final response may have incorrect or missing content-type

### Proposed Flow (Fixed)
1. Static content handler sets `Content-Type: text/html`
2. Enhanced header middleware preserves existing headers
3. CORS headers added without overriding content-type
4. Security headers added without conflicts
5. Final response maintains correct content-type

## Components and Interfaces

### 1. Enhanced Response Header Utilities

```typescript
interface HeaderPreservationOptions {
  preserveContentType: boolean;
  preserveCacheHeaders: boolean;
  preserveCustomHeaders: boolean;
}

interface ResponseWithHeaders {
  response: Response;
  preservedHeaders: Record<string, string>;
}
```

### 2. Static Content Handler Improvements

The static content handler needs to be more explicit about content-type handling:

- Ensure content-type is set before any other header operations
- Add validation to confirm content-type is correctly applied
- Provide fallback content-type detection for edge cases

### 3. Middleware Chain Refactoring

Replace the current header functions with a more robust middleware system:

- `createResponseWithPreservedHeaders()` - Creates new responses while preserving critical headers
- `addHeadersSafely()` - Adds headers without overriding existing ones
- `validateResponseHeaders()` - Ensures required headers are present

## Data Models

### Response Header Configuration

```typescript
interface ResponseHeaderConfig {
  contentType: string;
  corsHeaders: Record<string, string>;
  securityHeaders: Record<string, string>;
  cacheHeaders: Record<string, string>;
}
```

### Static Content Mapping

```typescript
interface StaticContentEntry {
  content: string;
  contentType: string;
  cacheStrategy: 'static' | 'dynamic' | 'no-cache';
}
```

## Error Handling

### Content-Type Detection Failures
- Fallback to `text/plain` for unknown file types
- Log warnings when content-type cannot be determined
- Provide explicit content-type for all static routes

### Header Conflict Resolution
- Priority system: Content-Type > Security > CORS > Cache
- Validation to ensure critical headers are not overridden
- Error logging when header conflicts are detected

### Response Creation Failures
- Graceful degradation when Response constructor fails
- Fallback responses with minimal but correct headers
- Clear error messages for debugging

## Testing Strategy

### Unit Tests
1. **Content-Type Preservation Tests**
   - Verify HTML content serves with `text/html` header
   - Verify CSS content serves with `text/css` header
   - Verify JS content serves with `application/javascript` header

2. **Header Middleware Tests**
   - Test CORS header addition without content-type loss
   - Test security header addition without conflicts
   - Test header preservation through middleware chain

3. **Static Content Handler Tests**
   - Test content-type detection for all supported file types
   - Test fallback behavior for unknown file types
   - Test response creation with proper headers

### Integration Tests
1. **End-to-End Response Tests**
   - Test complete request flow for root route
   - Verify browser receives proper HTML content-type
   - Test all static asset routes (CSS, JS)

2. **Browser Compatibility Tests**
   - Verify HTML renders correctly in different browsers
   - Test that CSS and JS assets load properly
   - Confirm no CORS issues with static assets

### Manual Testing
1. **Browser Developer Tools Verification**
   - Check Network tab for correct content-type headers
   - Verify HTML is rendered, not displayed as text
   - Confirm all assets load without errors

2. **Cross-Browser Testing**
   - Test in Chrome, Firefox, Safari, Edge
   - Verify consistent behavior across browsers
   - Check mobile browser compatibility

## Implementation Approach

### Phase 1: Header Preservation Fix
- Fix `addCorsHeaders` to properly preserve existing headers
- Ensure `addSecurityHeaders` doesn't override content-type
- Add header validation utilities

### Phase 2: Static Content Handler Enhancement
- Improve content-type detection and setting
- Add explicit content-type validation
- Implement better error handling

### Phase 3: Testing and Validation
- Implement comprehensive test suite
- Add logging for header debugging
- Perform cross-browser testing

### Phase 4: Monitoring and Maintenance
- Add metrics for content-type correctness
- Implement alerts for header-related issues
- Document best practices for future development