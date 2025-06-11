// src/components/ui/FunScoreGauge.jsx
import React from 'react';

const FunScoreGauge = ({ 
  score = 672, 
  size = 'lg', 
  showLabel = true, 
  animated = true,
  className = '' 
}) => {
  // Score ranges for color coding (like credit scores)
  const getScoreInfo = (score) => {
    if (score >= 750) return { 
      color: '#10b981', // green-500
      bgColor: '#dcfce7', // green-100
      label: 'Excellent',
      textColor: 'text-green-700'
    };
    if (score >= 650) return { 
      color: '#3b82f6', // blue-500
      bgColor: '#dbeafe', // blue-100
      label: 'Good',
      textColor: 'text-blue-700'
    };
    if (score >= 550) return { 
      color: '#f59e0b', // yellow-500
      bgColor: '#fef3c7', // yellow-100
      label: 'Fair',
      textColor: 'text-yellow-700'
    };
    if (score >= 450) return { 
      color: '#f97316', // orange-500
      bgColor: '#fed7aa', // orange-100
      label: 'Poor',
      textColor: 'text-orange-700'
    };
    return { 
      color: '#ef4444', // red-500
      bgColor: '#fee2e2', // red-100
      label: 'Very Poor',
      textColor: 'text-red-700'
    };
  };

  // Size configurations
  const sizes = {
    sm: { 
      width: 120, 
      height: 120, 
      strokeWidth: 8, 
      fontSize: 'text-lg',
      labelSize: 'text-xs'
    },
    md: { 
      width: 160, 
      height: 160, 
      strokeWidth: 10, 
      fontSize: 'text-2xl',
      labelSize: 'text-sm'
    },
    lg: { 
      width: 200, 
      height: 200, 
      strokeWidth: 12, 
      fontSize: 'text-3xl',
      labelSize: 'text-base'
    },
    xl: { 
      width: 240, 
      height: 240, 
      strokeWidth: 14, 
      fontSize: 'text-4xl',
      labelSize: 'text-lg'
    }
  };

  const config = sizes[size];
  const scoreInfo = getScoreInfo(score);
  
  // Calculate gauge parameters
  const center = config.width / 2;
  const radius = center - config.strokeWidth;
  const circumference = Math.PI * radius; // Half circle
  
  // Convert score (300-850) to percentage (0-100)
  const minScore = 300;
  const maxScore = 850;
  const normalizedScore = Math.max(0, Math.min(100, ((score - minScore) / (maxScore - minScore)) * 100));
  
  // Calculate stroke offset for the progress arc
  const offset = circumference - (normalizedScore / 100) * circumference;

  // Generate tick marks
  const generateTicks = () => {
    const ticks = [];
    const tickCount = 6; // 300, 400, 500, 600, 700, 800+
    
    for (let i = 0; i <= tickCount; i++) {
      const angle = (i / tickCount) * Math.PI - Math.PI; // -180 to 0 degrees
      const tickRadius = radius - 5;
      const x1 = center + tickRadius * Math.cos(angle);
      const y1 = center + tickRadius * Math.sin(angle);
      const x2 = center + (tickRadius - 8) * Math.cos(angle);
      const y2 = center + (tickRadius - 8) * Math.sin(angle);
      
      ticks.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#9ca3af"
          strokeWidth="2"
        />
      );
    }
    return ticks;
  };

  // Generate score labels
  const generateScoreLabels = () => {
    const labels = [];
    const scores = [300, 450, 600, 750, 850];
    
    scores.forEach((labelScore, i) => {
      const angle = (i / (scores.length - 1)) * Math.PI - Math.PI;
      const labelRadius = radius - 25;
      const x = center + labelRadius * Math.cos(angle);
      const y = center + labelRadius * Math.sin(angle) + 4;
      
      labels.push(
        <text
          key={labelScore}
          x={x}
          y={y}
          textAnchor="middle"
          className="fill-gray-500 text-xs font-medium"
        >
          {labelScore}
        </text>
      );
    });
    return labels;
  };

  // Calculate needle position
  const needleAngle = (normalizedScore / 100) * Math.PI - Math.PI;
  const needleLength = radius - 15;
  const needleX = center + needleLength * Math.cos(needleAngle);
  const needleY = center + needleLength * Math.sin(needleAngle);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: config.width, height: config.height }}>
        <svg
          width={config.width}
          height={config.height}
          viewBox={`0 0 ${config.width} ${config.height}`}
          className="transform rotate-0"
        >
          {/* Background arc */}
          <path
            d={`M ${config.strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth} ${center}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Progress arc */}
          <path
            d={`M ${config.strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth} ${center}`}
            fill="none"
            stroke={scoreInfo.color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? offset : 0}
            className={animated ? 'transition-all duration-1000 ease-out' : ''}
            style={{
              transformOrigin: `${center}px ${center}px`,
            }}
          />
          
          {/* Tick marks */}
          {generateTicks()}
          
          {/* Score labels */}
          {generateScoreLabels()}
          
          {/* Needle */}
          <g className={animated ? 'transition-all duration-1000 ease-out' : ''}>
            <line
              x1={center}
              y1={center}
              x2={needleX}
              y2={needleY}
              stroke="#374151"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx={center}
              cy={center}
              r="6"
              fill="#374151"
            />
            <circle
              cx={center}
              cy={center}
              r="3"
              fill="white"
            />
          </g>
          
          {/* Center score display */}
          <text
            x={center}
            y={center + 40}
            textAnchor="middle"
            className={`font-bold fill-gray-900 ${config.fontSize}`}
          >
            {score}
          </text>
        </svg>
        
        {/* Score range indicator */}
        <div 
          className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full ${scoreInfo.bgColor} border`}
        >
          <span className={`${config.labelSize} font-semibold ${scoreInfo.textColor}`}>
            {scoreInfo.label}
          </span>
        </div>
      </div>
      
      {showLabel && (
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-gray-700">Fun Score</p>
          <p className="text-xs text-gray-500">300 - 850 Range</p>
        </div>
      )}
    </div>
  );
};

export default FunScoreGauge;

// Usage Examples:
/*
// Basic usage
<FunScoreGauge score={672} />

// Different sizes
<FunScoreGauge score={750} size="sm" />
<FunScoreGauge score={425} size="xl" />

// Without animation
<FunScoreGauge score={600} animated={false} />

// Without label
<FunScoreGauge score={680} showLabel={false} />

// Custom styling
<FunScoreGauge 
  score={720} 
  size="lg" 
  className="bg-white p-6 rounded-lg shadow-lg" 
/>
*/