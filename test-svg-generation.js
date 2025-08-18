/**
 * Simple test to verify SVG image generation works
 */

import { SVGImageGenerator } from './src/services/svg-image-generator.js';

async function testSVGGeneration() {
  try {
    console.log('Testing SVG image generation...');
    
    const generator = new SVGImageGenerator(800, 400);
    
    // Add drop shadow filter
    generator.addDropShadowFilter('textShadow', 2, 2, 4, 0.5);
    
    // Set gradient background
    generator.setGradientBackground(['#667eea', '#764ba2'], 'vertical');
    
    // Draw text
    generator.drawText('Hello, World!', 400, 200, {
      fontSize: 48,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      fill: '#ffffff',
      textAnchor: 'middle',
      dominantBaseline: 'middle',
      filter: 'url(#textShadow)'
    });
    
    // Generate SVG
    const svgContent = generator.toSVG();
    
    console.log('✅ SVG generation successful!');
    console.log('SVG length:', svgContent.length, 'characters');
    console.log('First 200 characters:', svgContent.substring(0, 200) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ SVG generation failed:', error);
    return false;
  }
}

// Run test
testSVGGeneration().then(success => {
  process.exit(success ? 0 : 1);
});