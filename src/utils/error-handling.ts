/**
 * Comprehensive error handling utilities
 */

export enum ErrorType {
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  IMAGE_GENERATION_ERROR = 'IMAGE_GENERATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: string;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly context?: Record<string, any>;
  public readonly timestamp: string;

  constructor(type: ErrorType, message: string, context?: Record<string, any>, originalError?: Error) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.context = context;
    this.timestamp = new Date().toISOString();
    
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: ErrorDetails, includeDetails: boolean = false): Response {
  const errorResponse: any = {
    error: true,
    type: error.type,
    message: error.message,
    timestamp: error.timestamp
  };

  if (includeDetails && error.context) {
    errorResponse.details = error.context;
  }

  let status: number;
  let contentType = 'application/json';

  switch (error.type) {
    case ErrorType.GITHUB_API_ERROR:
      status = 502; // Bad Gateway
      break;
    case ErrorType.VALIDATION_ERROR:
      status = 400; // Bad Request
      break;
    case ErrorType.NETWORK_ERROR:
    case ErrorType.TIMEOUT_ERROR:
      status = 504; // Gateway Timeout
      break;
    case ErrorType.IMAGE_GENERATION_ERROR:
      status = 500; // Internal Server Error
      // For image endpoints, return plain text for better UX
      contentType = 'text/plain';
      return new Response('Failed to generate image. Please try again.', {
        status,
        headers: { 'Content-Type': contentType }
      });
    default:
      status = 500; // Internal Server Error
  }

  return new Response(JSON.stringify(errorResponse, null, 2), {
    status,
    headers: { 'Content-Type': contentType }
  });
}

/**
 * Log error with context
 */
export function logError(error: ErrorDetails): void {
  console.error(`[${error.timestamp}] ${error.type}: ${error.message}`, {
    context: error.context,
    originalError: error.originalError
  });
}

/**
 * Handle GitHub API errors
 */
export function handleGitHubError(error: any, username: string): AppError {
  if (error.message?.includes('not found')) {
    return new AppError(
      ErrorType.GITHUB_API_ERROR,
      `GitHub user '${username}' not found`,
      { username, statusCode: 404 },
      error
    );
  }
  
  if (error.message?.includes('rate limit')) {
    return new AppError(
      ErrorType.GITHUB_API_ERROR,
      'GitHub API rate limit exceeded. Please try again later.',
      { username, statusCode: 403 },
      error
    );
  }
  
  if (error.message?.includes('timeout')) {
    return new AppError(
      ErrorType.TIMEOUT_ERROR,
      'GitHub API request timed out. Please try again.',
      { username },
      error
    );
  }
  
  return new AppError(
    ErrorType.GITHUB_API_ERROR,
    'Failed to fetch GitHub user information',
    { username },
    error
  );
}

/**
 * Handle image generation errors
 */
export function handleImageGenerationError(error: any, context: Record<string, any>): AppError {
  if (error.message?.includes('OffscreenCanvas')) {
    return new AppError(
      ErrorType.IMAGE_GENERATION_ERROR,
      'Canvas initialization failed. Browser may not support OffscreenCanvas.',
      context,
      error
    );
  }
  
  if (error.message?.includes('fetch')) {
    return new AppError(
      ErrorType.NETWORK_ERROR,
      'Failed to load avatar image',
      context,
      error
    );
  }
  
  if (error.message?.includes('memory') || error.message?.includes('allocation')) {
    return new AppError(
      ErrorType.IMAGE_GENERATION_ERROR,
      'Insufficient memory for image generation. Try smaller dimensions.',
      context,
      error
    );
  }
  
  return new AppError(
    ErrorType.IMAGE_GENERATION_ERROR,
    'Image generation failed',
    context,
    error
  );
}

/**
 * Handle validation errors
 */
export function handleValidationError(field: string, value: any, expectedType: string): AppError {
  return new AppError(
    ErrorType.VALIDATION_ERROR,
    `Invalid ${field}: expected ${expectedType}, got ${typeof value}`,
    { field, value, expectedType }
  );
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler: (error: any, ...args: T) => AppError
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = errorHandler(error, ...args);
      logError({
        type: appError.type,
        message: appError.message,
        context: appError.context,
        originalError: error instanceof Error ? error : undefined,
        timestamp: appError.timestamp
      });
      throw appError;
    }
  };
}

/**
 * Create fallback response for critical failures
 */
export function createFallbackResponse(message: string = 'Service temporarily unavailable'): Response {
  return new Response(message, {
    status: 503,
    headers: {
      'Content-Type': 'text/plain',
      'Retry-After': '60'
    }
  });
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: AppError): boolean {
  return [
    ErrorType.NETWORK_ERROR,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.GITHUB_API_ERROR
  ].includes(error.type);
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.GITHUB_API_ERROR:
      if (error.context?.statusCode === 404) {
        return `GitHub user '${error.context.username}' not found. Please check the username and try again.`;
      }
      if (error.context?.statusCode === 403) {
        return 'GitHub API rate limit reached. Please try again in a few minutes.';
      }
      return 'Unable to fetch GitHub user data. Please try again later.';
      
    case ErrorType.IMAGE_GENERATION_ERROR:
      return 'Failed to generate image. Please try with different parameters.';
      
    case ErrorType.VALIDATION_ERROR:
      return `Invalid input: ${error.message}`;
      
    case ErrorType.NETWORK_ERROR:
      return 'Network error occurred. Please check your connection and try again.';
      
    case ErrorType.TIMEOUT_ERROR:
      return 'Request timed out. Please try again.';
      
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}