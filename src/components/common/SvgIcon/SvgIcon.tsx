'use client';

import React, { useState, useEffect } from 'react';

interface SvgIconProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
  color?: string;
  alt?: string;
}

const SvgIcon: React.FC<SvgIconProps> = ({
  src,
  className = '',
  style = {},
  width,
  height,
  color,
  alt = '',
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSvg = async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${src}`);
        }
        let svgText = await response.text();
        
        // Replace fill and stroke with currentColor to allow CSS color control
        // But preserve fill="none" and stroke="none"
        svgText = svgText.replace(/fill="[^"]*"/g, (match) => {
          if (match.includes('fill="none"')) return match;
          return 'fill="currentColor"';
        });
        svgText = svgText.replace(/stroke="[^"]*"/g, (match) => {
          if (match.includes('stroke="none"')) return match;
          return 'stroke="currentColor"';
        });
        
        // If no fill attribute exists on the root svg, add currentColor
        if (!svgText.includes('fill=')) {
          svgText = svgText.replace('<svg', '<svg fill="currentColor"');
        }
        
        setSvgContent(svgText);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading SVG:', error);
        setIsLoading(false);
      }
    };

    if (src) {
      loadSvg();
    }
  }, [src]);

  if (isLoading) {
    return (
      <div
        className={className}
        style={{ width, height, ...style }}
        aria-label={alt}
      />
    );
  }

  if (!svgContent) {
    return null;
  }

  const combinedStyle: React.CSSProperties = {
    width,
    height,
    display: 'inline-flex',
    color: color || 'inherit',
    ...style,
  };

  return (
    <div
      className={className}
      style={combinedStyle}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      aria-label={alt}
    />
  );
};

export default SvgIcon;

