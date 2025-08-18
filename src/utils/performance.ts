/**
 * Performance optimization utilities
 */

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: number;
  operation: string;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  /**
   * Start timing an operation
   */
  start(operation: string): void {
    this.metrics.set(operation, {
      startTime: Date.now(),
      operation
    });
  }

  /**
   * End timing an operation
   */
  end(operation: string): PerformanceMetrics | null {
    const metric = this.metrics.get(operation);
    if (!metric) {
      return null;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    
    return metric;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Log performance metrics
   */
  logMetrics(): void {
    for (const [operation, metric] of this.metrics) {
      if (metric.duration !== undefined) {
        console.log(`Performance [${operation}]: ${metric.duration}ms`);
      }
    }
  }
}

/**
 * Memory-efficient image generation options
 */
export interface OptimizedImageOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'png' | 'jpeg';
}

/**
 * Optimize image dimensions for memory efficiency
 */
export function optimizeImageDimensions(width: number, height: number, maxPixels: number = 2000000): { width: number; height: number } {
  const totalPixels = width * height;
  
  if (totalPixels <= maxPixels) {
    return { width, height };
  }
  
  const ratio = Math.sqrt(maxPixels / totalPixels);
  return {
    width: Math.floor(width * ratio),
    height: Math.floor(height * ratio)
  };
}

/**
 * Create optimized cache headers based on content type
 */
export function createOptimizedCacheHeaders(contentType: string, isStatic: boolean = false): Record<string, string> {
  if (isStatic) {
    // Long cache for static assets
    return {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24 hours
      'Expires': new Date(Date.now() + 86400 * 1000).toUTCString(),
      'ETag': `"${Date.now()}"`,
      'Vary': 'Accept-Encoding'
    };
  }
  
  if (contentType.startsWith('image/')) {
    // Short cache for dynamic images
    return {
      'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minutes
      'Expires': new Date(Date.now() + 300 * 1000).toUTCString(),
      'Vary': 'Accept'
    };
  }
  
  // No cache for API responses
  return {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Expires': '-1',
    'Pragma': 'no-cache'
  };
}

/**
 * Request timeout wrapper
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation '${operation}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

/**
 * Batch processing utility for multiple operations
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 5,
  delayMs: number = 0
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    // Add delay between batches if specified
    if (delayMs > 0 && i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Memory usage estimation for image generation
 */
export function estimateImageMemoryUsage(width: number, height: number, channels: number = 4): number {
  // Rough estimation: width * height * channels (RGBA) * bytes per channel
  return width * height * channels * 1; // 1 byte per channel
}

/**
 * Check if image dimensions are within memory limits
 */
export function isWithinMemoryLimits(width: number, height: number, maxMemoryMB: number = 50): boolean {
  const estimatedMemory = estimateImageMemoryUsage(width, height);
  const maxMemoryBytes = maxMemoryMB * 1024 * 1024;
  return estimatedMemory <= maxMemoryBytes;
}

/**
 * Optimize fetch requests with retry logic
 */
export async function optimizedFetch(
  url: string,
  options: RequestInit = {},
  retries: number = 3,
  retryDelay: number = 1000
): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Greeting-Image-Generator/1.0',
          ...options.headers
        }
      });
      
      if (response.ok) {
        return response;
      }
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Create performance-optimized response
 */
export function createOptimizedResponse(
  body: BodyInit,
  contentType: string,
  isStatic: boolean = false,
  additionalHeaders: Record<string, string> = {}
): Response {
  const cacheHeaders = createOptimizedCacheHeaders(contentType, isStatic);
  
  const headers = {
    'Content-Type': contentType,
    ...cacheHeaders,
    ...additionalHeaders
  };
  
  return new Response(body, { headers });
}