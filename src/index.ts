/**
 * Cloudflare Workers entry point for greeting image generator
 */

export interface Env {
  // Environment variables will be defined here
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  newResponse.headers.set("Access-Control-Allow-Origin", "*");
  newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  newResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return newResponse;
}

/**
 * Add security and caching headers
 */
function addSecurityHeaders(response: Response): Response {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function handleOptions(): Response {
  return addCorsHeaders(new Response(null, { status: 204 }));
}

/**
 * Handle static content (HTML, CSS, JS)
 */
async function handleStaticContent(path: string): Promise<Response | null> {
  const { serveStaticFile } = await import("./utils/static-content");
  return await serveStaticFile(path);
}

/**
 * Handle /image endpoint - simple greeting image generation
 */
async function handleImage(request: Request): Promise<Response> {
  const { handleImageEndpoint } = await import("./handlers/image");
  return await handleImageEndpoint(request);
}

/**
 * Handle /github endpoint - enhanced GitHub greeting image
 */
async function handleGitHub(request: Request): Promise<Response> {
  const { handleGitHubEndpoint } = await import("./handlers/github");
  return await handleGitHubEndpoint(request);
}

/**
 * Handle /svg endpoint - animated SVG greeting image
 */
async function handleSVG(request: Request): Promise<Response> {
  const { handleImageEndpoint } = await import("./handlers/image");
  // Add animated=true parameter to the request URL
  const url = new URL(request.url);
  url.searchParams.set('animated', 'true');
  url.searchParams.set('animateType', url.searchParams.get('animateType') || 'color');
  url.searchParams.set('textAnimation', url.searchParams.get('textAnimation') || 'true');

  const modifiedRequest = new Request(url.toString(), request);
  return await handleImageEndpoint(modifiedRequest);
}

/**
 * Handle 404 errors
 */
function handleNotFound(): Response {
  return new Response("Not Found", {
    status: 404,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * Handle errors with proper response
 */
async function handleError(error: Error): Promise<Response> {
  try {
    const {
      AppError,
      createErrorResponse,
      logError,
      createFallbackResponse,
      ErrorType,
    } = await import("./utils/error-handling");

    if (error instanceof AppError) {
      logError({
        type: error.type,
        message: error.message,
        context: error.context,
        originalError: error,
        timestamp: error.timestamp,
      });
      return createErrorResponse({
        type: error.type,
        message: error.message,
        context: error.context,
        timestamp: error.timestamp,
      });
    }

    // Handle unknown errors
    console.error("Unexpected worker error:", error);
    logError({
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message || "Unknown error occurred",
      originalError: error,
      timestamp: new Date().toISOString(),
    });

    return createFallbackResponse();
  } catch (importError) {
    // Fallback if error handling module fails to import
    console.error("Failed to import error handling:", importError);
    console.error("Original error:", error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}

/**
 * Main request router
 */
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return handleOptions();
  }

  // Route requests
  try {
    // Try to serve static content first
    const staticResponse = await handleStaticContent(path);
    if (staticResponse) {
      return staticResponse;
    }

    // Handle API endpoints
    switch (path) {
      case "/":
      case "/image":
        return await handleImage(request);

      case "/svg":
        return await handleSVG(request);

      case "/github":
        return await handleGitHub(request);

      default:
        return handleNotFound();
    }
  } catch (error) {
    return await handleError(error as Error);
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const response = await handleRequest(request, env);
    return addSecurityHeaders(addCorsHeaders(response));
  },
};
