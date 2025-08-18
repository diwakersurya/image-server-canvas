/**
 * SVG-based image generation service for Cloudflare Workers
 * Alternative to OffscreenCanvas which is not available in Workers
 */

export interface SVGImageOptions {
  width: number;
  height: number;
  backgroundColor: string;
  user: string;
  message: string;
  language: string;
}

export class SVGImageGenerator {
  private width: number;
  private height: number;
  private elements: string[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Set background color or gradient
   */
  setBackground(color: string): void {
    this.elements.push(`
      <rect width="100%" height="100%" fill="${color}"/>
    `);
  }

  /**
   * Set gradient background
   */
  setGradientBackground(colors: string[], direction: 'horizontal' | 'vertical' = 'horizontal'): void {
    const gradientId = 'bg-gradient';
    const x1 = direction === 'horizontal' ? '0%' : '0%';
    const y1 = direction === 'horizontal' ? '0%' : '0%';
    const x2 = direction === 'horizontal' ? '100%' : '0%';
    const y2 = direction === 'horizontal' ? '0%' : '100%';

    const stops = colors.map((color, index) => 
      `<stop offset="${(index / (colors.length - 1)) * 100}%" stop-color="${color}"/>`
    ).join('');

    this.elements.unshift(`
      <defs>
        <linearGradient id="${gradientId}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
          ${stops}
        </linearGradient>
      </defs>
    `);

    this.elements.push(`
      <rect width="100%" height="100%" fill="url(#${gradientId})"/>
    `);
  }

  /**
   * Draw text with styling
   */
  drawText(text: string, x: number, y: number, options: {
    fontSize: number;
    fontFamily?: string;
    fontWeight?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    textAnchor?: 'start' | 'middle' | 'end';
    dominantBaseline?: 'auto' | 'middle' | 'hanging';
    filter?: string;
  }): void {
    const {
      fontSize,
      fontFamily = 'Arial, sans-serif',
      fontWeight = 'normal',
      fill = '#000000',
      stroke,
      strokeWidth = 1,
      textAnchor = 'start',
      dominantBaseline = 'auto',
      filter
    } = options;

    const strokeAttr = stroke ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : '';
    const filterAttr = filter ? `filter="${filter}"` : '';

    this.elements.push(`
      <text x="${x}" y="${y}" 
            font-family="${fontFamily}" 
            font-size="${fontSize}" 
            font-weight="${fontWeight}"
            fill="${fill}" 
            ${strokeAttr}
            text-anchor="${textAnchor}"
            dominant-baseline="${dominantBaseline}"
            ${filterAttr}>
        ${this.escapeXml(text)}
      </text>
    `);
  }

  /**
   * Draw circle (for avatar placeholder)
   */
  drawCircle(cx: number, cy: number, r: number, options: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  } = {}): void {
    const {
      fill = '#cccccc',
      stroke,
      strokeWidth = 1
    } = options;

    const strokeAttr = stroke ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : '';

    this.elements.push(`
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${strokeAttr}/>
    `);
  }

  /**
   * Draw rectangle
   */
  drawRectangle(x: number, y: number, width: number, height: number, options: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    rx?: number;
  } = {}): void {
    const {
      fill = '#000000',
      stroke,
      strokeWidth = 1,
      rx = 0
    } = options;

    const strokeAttr = stroke ? `stroke="${stroke}" stroke-width="${strokeWidth}"` : '';
    const rxAttr = rx > 0 ? `rx="${rx}"` : '';

    this.elements.push(`
      <rect x="${x}" y="${y}" width="${width}" height="${height}" 
            fill="${fill}" ${strokeAttr} ${rxAttr}/>
    `);
  }

  /**
   * Add drop shadow filter
   */
  addDropShadowFilter(id: string, dx: number = 2, dy: number = 2, blur: number = 4, opacity: number = 0.5): void {
    this.elements.unshift(`
      <defs>
        <filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${blur}" flood-opacity="${opacity}"/>
        </filter>
      </defs>
    `);
  }

  /**
   * Generate complete SVG string
   */
  generateSVG(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${this.width}" height="${this.height}" 
     viewBox="0 0 ${this.width} ${this.height}" 
     xmlns="http://www.w3.org/2000/svg">
  ${this.elements.join('\n')}
</svg>`;
  }

  /**
   * Generate PNG from SVG (using external service or return SVG)
   * For now, we'll return the SVG directly as it can be displayed in browsers
   */
  async toPNG(): Promise<ArrayBuffer> {
    const svgString = this.generateSVG();
    const encoder = new TextEncoder();
    return encoder.encode(svgString).buffer;
  }

  /**
   * Get SVG as string (for direct SVG responses)
   */
  toSVG(): string {
    return this.generateSVG();
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Clear all elements
   */
  clear(): void {
    this.elements = [];
  }
}