import React from 'react';

interface CricketLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const CricketLoader: React.FC<CricketLoaderProps> = ({ 
  size = 'md', 
  text = 'Loading...' 
}) => {
  const sizeConfig = {
    sm: { ball: 'w-8 h-8', seam: 'h-0.5', text: 'text-sm' },
    md: { ball: 'w-12 h-12', seam: 'h-1', text: 'text-base' },
    lg: { ball: 'w-16 h-16', seam: 'h-1', text: 'text-lg' }
  };

  const config = sizeConfig[size];

  return (
    <div className="flex flex-col items-center justify-center p-6">
      {/* Cricket ball with spin animation */}
      <div 
        className={`${config.ball} bg-primary rounded-full mb-4 animate-spin relative shadow-lg`}
        style={{ animationDuration: '1s' }}
      >
        {/* Cricket ball seam */}
        <div className={`absolute top-1/2 left-0 right-0 ${config.seam} bg-primary-foreground/30 transform -translate-y-1/2 rounded-full`} />
      </div>

      {/* Loading text */}
      <p className={`${config.text} font-medium text-muted-foreground animate-pulse`}>
        {text}
      </p>
    </div>
  );
};

export default CricketLoader;