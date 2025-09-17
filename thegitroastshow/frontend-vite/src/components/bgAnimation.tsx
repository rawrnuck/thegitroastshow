import { useState, useEffect, useMemo, useCallback } from 'react';

const GitHubBackgroundAnimation = () => {
  const [animationTime, setAnimationTime] = useState(0);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  
  // GitHub contribution colors + red variants for hover
  const colors = {
    normal: [
      '#111319', // Dark background
      '#0d1117', // Darker
      '#21262d', // Medium dark
      '#30363d', // Medium
      '#484f58', // Light gray
      '#9be9a8', // GitHub light green
      '#40c463', // GitHub medium green
      '#30a14e', // GitHub dark green
      '#216e39'  // GitHub darkest green
    ],
    hover: [
      '#2d1b1b', // Dark red background
      '#1f0d0d', // Darker red
      '#3d2121', // Medium dark red
      '#4a3030', // Medium red
      '#5a4848', // Light red gray
      '#ff6b6b', // Light red
      '#ff4757', // Medium red
      '#ff3742', // Dark red
      '#e84118'  // Darkest red
    ]
  };

  // Define type for the grid square
  type GridSquare = {
    id: string;
    row: number;
    col: number;
    x: number;
    y: number;
    batchId: number;
    phaseOffset: number;
  };

  // Track window dimensions
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  // Update window dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Create a proper full-screen grid
  const gridData = useMemo(() => {
    const squareSize = 12;
    const gap = 3;
    const totalSquareSize = squareSize + gap;
    
    const cols = Math.ceil(windowSize.width / totalSquareSize) + 2; // Extra columns for coverage
    const rows = Math.ceil(windowSize.height / totalSquareSize) + 2; // Extra rows for coverage
    
    const grid = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        grid.push({
          id: `${row}-${col}`,
          row,
          col,
          x: col * totalSquareSize,
          y: row * totalSquareSize,
          batchId: (row + col) % 12,
          phaseOffset: (row * 7 + col * 3) % 100,
        });
      }
    }
    return { grid, cols, rows, totalSquareSize, squareSize };
  }, [windowSize.width, windowSize.height]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationTime(prev => prev + 1);
    }, 60);

    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const getSquareIntensity = (square: GridSquare) => {
    const time = animationTime * 0.1;
    const { row, col, batchId, phaseOffset } = square;
    
    // Create wave patterns
    const wave1 = Math.sin(time * 0.8 + (row + col) * 0.1 + phaseOffset * 0.01) * 0.5 + 0.5;
    const wave2 = Math.cos(time * 0.5 + row * 0.15 - col * 0.1) * 0.3 + 0.7;
    const wave3 = Math.sin(time * 1.2 + batchId * 0.5) * 0.4 + 0.6;
    
    // Add noise
    const noise = Math.sin(row * 23.1 + col * 17.3 + time * 0.3) * 0.2;
    
    // Combine waves
    let intensity = (wave1 * wave2 * wave3 + noise) * 0.8;
    
    // Add sparkles
    if (Math.sin(time * 2 + row * 31 + col * 37) > 0.98) {
      intensity = Math.max(intensity, 0.9);
    }
    
    // Clamp and convert to color index
    intensity = Math.max(0, Math.min(1, intensity));
    
    if (intensity < 0.1) return 0;
    if (intensity < 0.2) return 1;
    if (intensity < 0.3) return 2;
    if (intensity < 0.4) return 3;
    if (intensity < 0.5) return 4;
    if (intensity < 0.6) return 5;
    if (intensity < 0.7) return 6;
    if (intensity < 0.8) return 7;
    return 8;
  };

  const getDistanceFromMouse = (square: GridSquare) => {
    const centerX = square.x + gridData.squareSize / 2;
    const centerY = square.y + gridData.squareSize / 2;
    return Math.sqrt(
      Math.pow(mousePos.x - centerX, 2) + Math.pow(mousePos.y - centerY, 2)
    );
  };

  const isInHoverRange = (square: GridSquare) => {
    return getDistanceFromMouse(square) < 80; // 80px hover radius
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0d1117',
      overflow: 'hidden',
      cursor: 'none',
      zIndex: 0
    }}>
      {/* Full-screen grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}>
        {gridData.grid.map((square: GridSquare) => {
          const intensity = getSquareIntensity(square);
          const isHovered = isInHoverRange(square);
          const distance = getDistanceFromMouse(square);
          
          // Choose color palette based on hover
          const colorPalette = isHovered ? colors.hover : colors.normal;
          const color = colorPalette[intensity];
          
          // Add distortion effect based on distance from mouse
          let distortionIntensity = 0;
          if (isHovered) {
            distortionIntensity = Math.max(0, 1 - (distance / 80));
            // Boost intensity when hovered
            const boostedIntensity = Math.min(8, intensity + Math.floor(distortionIntensity * 3));
            const finalColor = colorPalette[boostedIntensity];
            
            return (
              <div
                key={square.id}
                className="absolute rounded-sm transition-all duration-150 ease-out"
                style={{
                  left: square.x,
                  top: square.y,
                  width: `${gridData.squareSize}px`,
                  height: `${gridData.squareSize}px`,
                  backgroundColor: finalColor,
                  boxShadow: intensity >= 5 ? `0 0 ${distortionIntensity * 15}px ${finalColor}` : 'none',
                  transform: `scale(${1 + distortionIntensity * 0.2}) rotate(${distortionIntensity * 5}deg)`,
                  zIndex: isHovered ? 10 : 1,
                }}
              />
            );
          }
          
          const isGreen = intensity >= 5;
          
          return (
            <div
              key={square.id}
              className="absolute rounded-sm transition-all duration-200 ease-out"
              style={{
                left: square.x,
                top: square.y,
                width: `${gridData.squareSize}px`,
                height: `${gridData.squareSize}px`,
                backgroundColor: color,
                boxShadow: isGreen ? `0 0 ${(intensity - 4) * 2}px ${color}` : 'none',
                opacity: intensity === 0 ? 0.4 : 1,
              }}
            />
          );
        })}
      </div>
      
      {/* Mouse cursor indicator */}
      <div 
        className="absolute w-4 h-4 bg-red-500 rounded-full pointer-events-none z-50 opacity-60"
        style={{
          left: mousePos.x - 8,
          top: mousePos.y - 8,
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
        }}
      />
      
      {/* Content layer */}
      <div className="relative z-20 flex items-center justify-center min-h-screen pointer-events-none">
        {/* Your content goes here */}
      </div>
    </div>
  );
};

export default GitHubBackgroundAnimation;