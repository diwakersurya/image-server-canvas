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

export interface ProfileBannerOptions {
  user: string;
  name: string;
  language: string;
  message: string;
  status: string;
  taglines: string[];
  theme: 'aurora' | 'midnight' | 'sunrise';
  animated: boolean;
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
   * Draw a self-contained, README-safe profile header. It uses only SVG and
   * SMIL so it remains useful in GitHub's image sandbox without JavaScript.
   */
  drawProfileBanner(options: ProfileBannerOptions): void {
    const palettes = {
      aurora: ['#07152d', '#173b72', '#1f7a8c', '#8b5cf6'],
      midnight: ['#080b14', '#172554', '#164e63', '#0f766e'],
      sunrise: ['#32122b', '#7c2d4d', '#d95d39', '#f59e0b'],
    };
    const [base, left, right, accent] = palettes[options.theme];
    const animations = options.animated ? `
      <animateTransform attributeName="transform" type="translate"
        values="-100,-45;110,40;-100,-45" dur="12s" repeatCount="indefinite"/>
    ` : '';
    const statusAnimation = options.animated ? `
      <animate attributeName="r" values="7;10;7" dur="2.4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="1;.45;1" dur="2.4s" repeatCount="indefinite"/>
    ` : '';
    const user = this.escapeXml(`@${options.user.replace(/^@+/, '')} · ${options.language}`);
    const greetingText = `${options.message}, I’m ${options.name}`;
    const greeting = this.escapeXml(greetingText);
    const greetingSize = greetingText.length > 48 ? 32 : greetingText.length > 34 ? 38 : 44;
    const status = this.escapeXml(options.status);
    const taglineElements = options.taglines.map((tagline, index) => {
      const animation = options.animated && options.taglines.length > 1
        ? this.taglineAnimation(index, options.taglines.length)
        : '';
      return `<text x="116" y="258" fill="#dbeafe" font-family="Arial, sans-serif" font-size="25" opacity="${index === 0 ? '1' : '0'}" transform="translate(0, 0)">${this.escapeXml(tagline)}${animation}</text>`;
    }).join('');

    this.elements.unshift(`
      <defs>
        <linearGradient id="profile-background" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${base}"/>
          <stop offset="52%" stop-color="${left}"/>
          <stop offset="100%" stop-color="${right}"/>
        </linearGradient>
        <filter id="profile-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="30"/>
        </filter>
      </defs>
    `);
    this.elements.push(`
      <rect width="100%" height="100%" rx="24" fill="url(#profile-background)"/>
      <g filter="url(#profile-glow)" opacity=".62" transform="translate(-100,-45)">
        <circle cx="190" cy="90" r="150" fill="${accent}">${animations}</circle>
        <circle cx="1010" cy="340" r="190" fill="${right}">${animations}</circle>
      </g>
      <rect x="72" y="66" width="5" height="266" rx="2.5" fill="${accent}"/>
      <text x="116" y="122" fill="#ffffff" font-family="Arial, sans-serif" font-size="${greetingSize}" font-weight="700">${greeting}</text>
      <text x="116" y="163" fill="#bfdbfe" font-family="Arial, sans-serif" font-size="22">${user}</text>
      ${taglineElements}
      <circle cx="123" cy="310" r="7" fill="#6ee7b7">${statusAnimation}</circle>
      <text x="143" y="318" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="20">${status}</text>
      <text x="1084" y="318" fill="#bfdbfe" font-family="Arial, sans-serif" font-size="18" text-anchor="end">GitHub profile</text>
    `);
  }

  private taglineAnimation(index: number, count: number): string {
    const cycle = count * 5;
    const start = index / count;
    const enter = start + 0.08 / count;
    const exit = (index + 1) / count - 0.08 / count;
    const end = (index + 1) / count;
    const timeline = index === 0
      ? {
          opacityValues: '0;1;1;0;0',
          transformValues: '0,12;0,0;0,0;0,-8;0,12',
          keyTimes: `0;${enter};${exit};${end};1`,
        }
      : {
          opacityValues: '0;0;1;1;0;0',
          transformValues: '0,12;0,12;0,0;0,0;0,-8;0,12',
          keyTimes: `0;${start};${enter};${exit};${end};1`,
        };

    return `
      <animate attributeName="opacity" values="${timeline.opacityValues}" keyTimes="${timeline.keyTimes}" dur="${cycle}s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="translate" values="${timeline.transformValues}" keyTimes="${timeline.keyTimes}" dur="${cycle}s" repeatCount="indefinite"/>
    `;
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