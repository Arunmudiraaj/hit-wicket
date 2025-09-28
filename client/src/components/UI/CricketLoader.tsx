import React from 'react';

interface CricketLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const CricketLoader: React.FC<CricketLoaderProps> = ({ size = 'md', text = 'Loading...' }) => {
  const sizeConfig = {
    sm: { ball: 'w-8 h-8', text: 'text-sm' },
    md: { ball: 'w-12 h-12', text: 'text-base' },
    lg: { ball: 'w-16 h-16', text: 'text-lg' }
  };

  const config = sizeConfig[size];

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Simple spinning cricket ball */}
      <div 
        className={`${config.ball} bg-red-500 rounded-full mb-4 animate-spin`}
        style={{ animationDuration: '1s' }}
      >
        {/* Cricket ball seam */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-700 transform -translate-y-0.5"></div>
      </div>

      {/* Loading text */}
      <div className={`${config.text} font-medium text-gray-700 animate-pulse`}>
        {text}
      </div>
    </div>
  );
};

export default CricketLoader;