/**
 * Image generation service using OffscreenCanvas for Cloudflare Workers
 */

export interface ImageGenerationOptions {
  width: number;
  height: number;
  backgroundColor: string;
  user: string;
  avatarUrl: string;
}

export interface TextStyle {
  font: string;
  fillStyle: string;
  strokeStyle?: string;
  strokeWidth?: number;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

export class ImageGenerator {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;

  constructor(width: number, height: number) {
    this.canvas = new OffscreenCanvas(width, height);
    const context = this.canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Failed to get 2D rendering context from OffscreenCanvas');
    }
    
    this.ctx = context;
  }

  /**
   * Set background color or gradient
   */
  setBackground(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Set gradient background
   */
  setGradientBackground(colors: string[], direction: 'horizontal' | 'vertical' = 'horizontal'): void {
    let gradient: CanvasGradient;
    
    if (direction === 'horizontal') {
      gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
    } else {
      gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    }

    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw text with styling
   */
  drawText(text: string, x: number, y: number, style: TextStyle): void {
    this.ctx.font = style.font;
    this.ctx.fillStyle = style.fillStyle;
    this.ctx.textAlign = style.textAlign;
    this.ctx.textBaseline = style.textBaseline;

    // Apply shadow if specified
    if (style.shadowColor) {
      this.ctx.shadowColor = style.shadowColor;
      this.ctx.shadowBlur = style.shadowBlur || 0;
      this.ctx.shadowOffsetX = style.shadowOffsetX || 0;
      this.ctx.shadowOffsetY = style.shadowOffsetY || 0;
    }

    // Draw stroke if specified
    if (style.strokeStyle && style.strokeWidth) {
      this.ctx.strokeStyle = style.strokeStyle;
      this.ctx.lineWidth = style.strokeWidth;
      this.ctx.strokeText(text, x, y);
    }

    // Draw fill text
    this.ctx.fillText(text, x, y);

    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  /**
   * Load and draw image from URL
   */
  async loadAndDrawImage(url: string, x: number, y: number, width: number, height: number): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);
      
      // Create ImageBitmap from the fetched data
      const blob = new Blob([imageData]);
      const imageBitmap = await createImageBitmap(blob);
      
      this.ctx.drawImage(imageBitmap, x, y, width, height);
      imageBitmap.close();
    } catch (error) {
      console.error('Failed to load image:', error);
      // Draw placeholder rectangle
      this.drawPlaceholderImage(x, y, width, height);
    }
  }

  /**
   * Draw circular clipped image (for avatars)
   */
  async drawCircularImage(url: string, centerX: number, centerY: number, radius: number): Promise<void> {
    this.ctx.save();
    
    // Create circular clipping path
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.clip();

    // Draw the image
    await this.loadAndDrawImage(url, centerX - radius, centerY - radius, radius * 2, radius * 2);
    
    this.ctx.restore();
  }

  /**
   * Draw placeholder image when avatar fails to load
   */
  private drawPlaceholderImage(x: number, y: number, width: number, height: number): void {
    // Draw gray background
    this.ctx.fillStyle = '#cccccc';
    this.ctx.fillRect(x, y, width, height);
    
    // Draw user icon placeholder
    this.ctx.fillStyle = '#999999';
    this.ctx.font = `${Math.min(width, height) * 0.4}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('👤', x + width / 2, y + height / 2);
  }

  /**
   * Draw rectangle with optional styling
   */
  drawRectangle(x: number, y: number, width: number, height: number, options: {
    fillStyle?: string;
    strokeStyle?: string;
    strokeWidth?: number;
    borderRadius?: number;
  } = {}): void {
    this.ctx.save();

    if (options.borderRadius) {
      this.drawRoundedRectangle(x, y, width, height, options.borderRadius);
    } else {
      this.ctx.rect(x, y, width, height);
    }

    if (options.fillStyle) {
      this.ctx.fillStyle = options.fillStyle;
      this.ctx.fill();
    }

    if (options.strokeStyle && options.strokeWidth) {
      this.ctx.strokeStyle = options.strokeStyle;
      this.ctx.lineWidth = options.strokeWidth;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Draw rounded rectangle
   */
  private drawRoundedRectangle(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  /**
   * Draw line
   */
  drawLine(x1: number, y1: number, x2: number, y2: number, strokeStyle: string, strokeWidth: number = 1): void {
    this.ctx.save();
    this.ctx.strokeStyle = strokeStyle;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * Measure text width
   */
  measureText(text: string, font: string): number {
    this.ctx.save();
    this.ctx.font = font;
    const metrics = this.ctx.measureText(text);
    this.ctx.restore();
    return metrics.width;
  }

  /**
   * Export canvas as PNG ArrayBuffer
   */
  async toPNG(): Promise<ArrayBuffer> {
    const blob = await this.canvas.convertToBlob({ type: 'image/png' });
    return await blob.arrayBuffer();
  }

  /**
   * Export canvas as JPEG ArrayBuffer
   */
  async toJPEG(quality: number = 0.9): Promise<ArrayBuffer> {
    const blob = await this.canvas.convertToBlob({ 
      type: 'image/jpeg',
      quality: quality
    });
    return await blob.arrayBuffer();
  }

  /**
   * Get canvas dimensions
   */
  getDimensions(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  /**
   * Clear canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}