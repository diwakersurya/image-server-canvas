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

export interface AnimatedGradientOptions {
  colors: string[];
  direction: 'horizontal' | 'vertical' | 'diagonal';
  duration: number; // in seconds
  repeatCount: 'indefinite' | number;
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  animateType?: 'color' | 'position' | 'opacity';
}

export interface AnimationOptions {
  duration: number;
  repeatCount: 'indefinite' | number;
  begin?: number; // delay in seconds
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
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
   * Set animated gradient background with SMIL animations
   */
  setAnimatedGradientBackground(options: AnimatedGradientOptions): void {
    const {
      colors,
      direction,
      duration,
      repeatCount,
      easing = 'linear',
      animateType = 'color'
    } = options;

    const gradientId = `animated-bg-gradient-${Date.now()}`;
    const x1 = direction === 'horizontal' ? '0%' : direction === 'diagonal' ? '0%' : '0%';
    const y1 = direction === 'vertical' ? '0%' : direction === 'diagonal' ? '0%' : '0%';
    const x2 = direction === 'horizontal' ? '100%' : direction === 'diagonal' ? '100%' : '0%';
    const y2 = direction === 'vertical' ? '100%' : direction === 'diagonal' ? '100%' : '0%';

    let gradientContent = '';
    let animationContent = '';

    if (animateType === 'color') {
      // Create multiple color stops with animation
      colors.forEach((color, index) => {
        const stopId = `stop-${index}`;
        const nextColor = colors[(index + 1) % colors.length];

        gradientContent += `<stop id="${stopId}" offset="${(index / (colors.length - 1)) * 100}%" stop-color="${color}"/>`;
        animationContent += `
          <animate
            xlink:href="#${stopId}"
            attributeName="stop-color"
            values="${color};${nextColor};${color}"
            dur="${duration}s"
            repeatCount="${repeatCount}"
            calcMode="paced"
            begin="${index * (duration / colors.length)}s"
          />`;
      });
    } else if (animateType === 'position') {
      // Animate gradient position
      gradientContent = colors.map((color, index) =>
        `<stop offset="${(index / (colors.length - 1)) * 100}%" stop-color="${color}"/>`
      ).join('');

      // Animate the gradient transform
      animationContent = `
        <animateTransform
          attributeName="gradientTransform"
          type="translate"
          values="0,0;-100,0;100,0;0,0"
          dur="${duration}s"
          repeatCount="${repeatCount}"
          calcMode="spline"
          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
        />`;
    } else if (animateType === 'opacity') {
      // Animate opacity of gradient stops
      colors.forEach((color, index) => {
        const stopId = `stop-${index}`;
        gradientContent += `<stop id="${stopId}" offset="${(index / (colors.length - 1)) * 100}%" stop-color="${color}" stop-opacity="1"/>`;

        animationContent += `
          <animate
            xlink:href="#${stopId}"
            attributeName="stop-opacity"
            values="1;0.3;1"
            dur="${duration}s"
            repeatCount="${repeatCount}"
            calcMode="paced"
            begin="${index * (duration / colors.length)}s"
          />`;
      });
    }

    this.elements.unshift(`
      <defs>
        <linearGradient id="${gradientId}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
          ${gradientContent}
          ${animationContent}
        </linearGradient>
      </defs>
    `);

    this.elements.push(`
      <rect width="100%" height="100%" fill="url(#${gradientId})"/>
    `);
  }

  /**
   * Add animated text with various effects
   */
  drawAnimatedText(text: string, x: number, y: number, options: {
    fontSize: number;
    fontFamily?: string;
    fontWeight?: string;
    fill?: string;
    animation?: {
      type: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounce' | 'typewriter';
      duration: number;
      delay?: number;
      repeatCount?: 'indefinite' | number;
    };
  }): void {
    const {
      fontSize,
      fontFamily = 'Arial, sans-serif',
      fontWeight = 'normal',
      fill = '#000000',
      animation
    } = options;

    let animationAttrs = '';
    let transformAttrs = '';

    if (animation) {
      const { type, duration, delay = 0, repeatCount = 1 } = animation;

      switch (type) {
        case 'fadeIn':
          animationAttrs = `
            <animate attributeName="opacity" values="0;1" dur="${duration}s" begin="${delay}s" repeatCount="${repeatCount}" fill="freeze"/>
          `;
          break;
        case 'slideIn':
          transformAttrs = `transform="translate(-50, 0)"`;
          animationAttrs = `
            <animateTransform attributeName="transform" type="translate" values="-50,0;0,0" dur="${duration}s" begin="${delay}s" repeatCount="${repeatCount}" fill="freeze"/>
          `;
          break;
        case 'scaleIn':
          transformAttrs = `transform="scale(0)"`;
          animationAttrs = `
            <animateTransform attributeName="transform" type="scale" values="0;1.2;1" dur="${duration}s" begin="${delay}s" repeatCount="${repeatCount}" fill="freeze"/>
          `;
          break;
        case 'bounce':
          animationAttrs = `
            <animateTransform attributeName="transform" type="translate" values="0,0;0,-10;0,0" dur="${duration}s" begin="${delay}s" repeatCount="${repeatCount}"/>
          `;
          break;
        case 'typewriter':
          // Create typewriter effect by animating text content
          const textLength = text.length;
          const charDuration = duration / textLength;

          // Create individual tspan elements for each character
          let typewriterContent = '';
          for (let i = 0; i < textLength; i++) {
            const char = text[i];
            const beginTime = delay + (i * charDuration);
            typewriterContent += `<tspan opacity="0">${this.escapeXml(char)}
              <animate attributeName="opacity" values="0;1" dur="${charDuration * 0.5}s" begin="${beginTime}s" fill="freeze"/>
            </tspan>`;
          }

          // Replace the text content with animated tspans
          this.elements.push(`
            <text x="${x}" y="${y}"
                  font-family="${fontFamily}"
                  font-size="${fontSize}"
                  font-weight="${fontWeight}"
                  fill="${fill}"
                  text-anchor="middle"
                  dominant-baseline="middle">
              ${typewriterContent}
            </text>
          `);
          return; // Exit early since we've already added the element
      }
    }

    this.elements.push(`
      <text x="${x}" y="${y}"
            font-family="${fontFamily}"
            font-size="${fontSize}"
            font-weight="${fontWeight}"
            fill="${fill}"
            text-anchor="middle"
            dominant-baseline="middle"
            ${transformAttrs}>
        ${this.escapeXml(text)}
        ${animationAttrs}
      </text>
    `);
  }

  /**
   * Add custom SMIL animation to any element
   */
  addCustomAnimation(elementId: string, attributeName: string, values: string, options: AnimationOptions): void {
    const { duration, repeatCount, begin = 0, easing = 'linear' } = options;

    this.elements.push(`
      <animate
        xlink:href="#${elementId}"
        attributeName="${attributeName}"
        values="${values}"
        dur="${duration}s"
        begin="${begin}s"
        repeatCount="${repeatCount}"
        calcMode="${easing === 'linear' ? 'linear' : 'paced'}"
        fill="freeze"
      />
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
     xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink">
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