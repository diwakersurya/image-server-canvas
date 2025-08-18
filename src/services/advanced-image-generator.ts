/**
 * Advanced image composition system for enhanced GitHub greeting images
 * Replaces Fabric.js functionality with OffscreenCanvas operations
 */

import { ImageGenerator, TextStyle } from './image-generator';
import { getGradientStops } from '../utils/helpers';

export interface AdvancedImageOptions {
  width: number;
  height: number;
  user: string;
  avatarUrl: string;
  userInfo: any; // GitHub user info
}

export interface GradientOptions {
  colors: string[];
  direction: 'horizontal' | 'vertical' | 'diagonal';
  stops?: number[];
}

export class AdvancedImageGenerator extends ImageGenerator {
  constructor(width: number, height: number) {
    super(width, height);
  }

  /**
   * Create complex gradient background similar to Fabric.js gradients
   */
  setAdvancedGradient(options: GradientOptions): void {
    const { width, height } = this.getDimensions();
    let gradient: CanvasGradient;

    switch (options.direction) {
      case 'horizontal':
        gradient = this.ctx.createLinearGradient(0, 0, width, 0);
        break;
      case 'vertical':
        gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        break;
      case 'diagonal':
        gradient = this.ctx.createLinearGradient(0, 0, width, height);
        break;
      default:
        gradient = this.ctx.createLinearGradient(0, 0, width, 0);
    }

    // Add color stops
    if (options.stops && options.stops.length === options.colors.length) {
      options.colors.forEach((color, index) => {
        gradient.addColorStop(options.stops![index], color);
      });
    } else {
      options.colors.forEach((color, index) => {
        gradient.addColorStop(index / (options.colors.length - 1), color);
      });
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
  }

  /**
   * Draw decorative ribbon element
   */
  drawRibbon(x: number, y: number, width: number, height: number, angle: number, colors: string[]): void {
    this.ctx.save();
    
    // Translate and rotate
    this.ctx.translate(x + width / 2, y + height / 2);
    this.ctx.rotate((angle * Math.PI) / 180);
    
    // Create gradient for ribbon
    const gradient = this.ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    
    // Draw ribbon
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(-width / 2, -height / 2, width, height);
    
    this.ctx.restore();
  }

  /**
   * Draw styled text with advanced effects (similar to Fabric.js text)
   */
  drawStyledText(text: string, x: number, y: number, options: {
    fontSize: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    shadow?: {
      color: string;
      blur: number;
      offsetX: number;
      offsetY: number;
    };
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
  }): void {
    const {
      fontSize,
      fontFamily = 'Arial',
      fontWeight = 'normal',
      fontStyle = 'normal',
      fill = '#000000',
      stroke,
      strokeWidth = 1,
      shadow,
      textAlign = 'left',
      textBaseline = 'top'
    } = options;

    const font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    
    const textStyle: TextStyle = {
      font,
      fillStyle: fill,
      textAlign,
      textBaseline,
      strokeStyle: stroke,
      strokeWidth: stroke ? strokeWidth : undefined,
      shadowColor: shadow?.color,
      shadowBlur: shadow?.blur,
      shadowOffsetX: shadow?.offsetX,
      shadowOffsetY: shadow?.offsetY
    };

    this.drawText(text, x, y, textStyle);
  }

  /**
   * Draw rounded rectangle with gradient fill
   */
  drawGradientRoundedRect(x: number, y: number, width: number, height: number, radius: number, colors: string[]): void {
    this.ctx.save();
    
    // Create gradient
    const gradient = this.ctx.createLinearGradient(x, y, x + width, y);
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    
    // Draw rounded rectangle
    this.drawRectangle(x, y, width, height, {
      fillStyle: gradient.toString(),
      borderRadius: radius
    });
    
    this.ctx.restore();
  }

  /**
   * Create complex background similar to original Fabric.js implementation
   */
  createComplexBackground(): void {
    const { width, height } = this.getDimensions();
    
    // Main gradient background
    const gradientStops = getGradientStops(2);
    const colors = Object.values(gradientStops);
    
    this.setAdvancedGradient({
      colors,
      direction: 'diagonal'
    });
    
    // Add decorative elements
    this.drawGradientRoundedRect(
      0, 
      100, 
      width, 
      height - 200, 
      20, 
      [colors[0], colors[1]]
    );
  }

  /**
   * Draw user information layout similar to original GitHub endpoint
   */
  drawUserInfoLayout(userInfo: any, greeting: { language: string; message: string }): void {
    const { width, height } = this.getDimensions();
    const centerX = width / 2;
    const centerY = height / 2;

    // Draw main greeting text
    this.drawStyledText(greeting.message, centerX, centerY - 100, {
      fontSize: 50,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      fill: 'rgb(255,255,255)',
      stroke: '#ffffff',
      textAlign: 'center',
      textBaseline: 'middle'
    });

    // Draw language indicator
    this.drawStyledText(`--(${greeting.language})--`, centerX, centerY - 30, {
      fontSize: 20,
      fontFamily: 'Arial, sans-serif',
      fill: 'rgb(255,255,255)',
      stroke: '#ffffff',
      textAlign: 'center',
      textBaseline: 'middle',
      shadow: {
        color: 'rgba(0,0,0,0.3)',
        blur: 5,
        offsetX: 5,
        offsetY: 5
      }
    });

    // Draw username
    this.drawStyledText(userInfo.login, width - 200, 50, {
      fontSize: 30,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'italic',
      fill: '#03A87C',
      stroke: 'rgba(255, 255, 255, 0.5)',
      strokeWidth: 1,
      textAlign: 'left',
      textBaseline: 'middle'
    });

    // Draw line under username
    const usernameWidth = this.measureText(userInfo.login, 'italic 30px Arial, sans-serif');
    this.drawLine(50, 70, width - 200 - 30, 70, '#03A87C', 1);
  }

  /**
   * Generate complete advanced image
   */
  async generateAdvancedImage(options: AdvancedImageOptions): Promise<ArrayBuffer> {
    const { user, avatarUrl, userInfo } = options;
    
    // Create complex background
    this.createComplexBackground();
    
    // Get random greeting (same as simple version for consistency)
    const { getRandomGreeting } = await import('../utils/messages');
    const greeting = getRandomGreeting();
    
    // Draw user info layout
    this.drawUserInfoLayout(userInfo, greeting);
    
    // Note: Avatar drawing would be handled separately if needed
    // For now, focusing on the text and background composition
    
    return await this.toPNG();
  }
}