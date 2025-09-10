import React from 'react';
import PixelBlast from './pixelblast';

interface PixelBlastBackgroundProps {
  className?: string;
  style?: React.CSSProperties;
}

const PixelBlastBackground: React.FC<PixelBlastBackgroundProps> = ({ 
  className = '', 
  style = {} 
}) => {
  return (
    <div 
      className={`w-full h-full relative -mt-[180px] ${className}`}
      style={{ width: '100%', height: '600px', position: 'relative', ...style }}
    >
      <PixelBlast
        variant="square"
        pixelSize={6}
        color="#B19EEF"
        patternScale={3}
        patternDensity={1.2}
        pixelSizeJitter={0.5}
        enableRipples
        rippleSpeed={0.4}
        rippleThickness={0.12}
        rippleIntensityScale={1.5}
        liquid
        liquidStrength={0.12}
        liquidRadius={1.2}
        liquidWobbleSpeed={5}
        speed={0.6}
        edgeFade={0.25}
        transparent
      />
      <PixelBlast
        variant="square"
        pixelSize={6}
        color="#B19EEF"
        patternScale={3}
        patternDensity={1.2}
        pixelSizeJitter={0.5}
        enableRipples
        rippleSpeed={0.4}
        rippleThickness={0.12}
        rippleIntensityScale={1.5}
        liquid
        liquidStrength={0.12}
        liquidRadius={1.2}
        liquidWobbleSpeed={5}
        speed={0.6}
        edgeFade={0.25}
        transparent
      />
    </div>
  );
};

export default PixelBlastBackground;
