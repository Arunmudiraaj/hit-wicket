import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type MatchmakingOverlayProps = {
  onCancel: () => void;
  playersOnline?: number;
  activeGames?: number;
};

export function MatchmakingOverlay({ onCancel, playersOnline = 0, activeGames = 0 }: MatchmakingOverlayProps) {
  const [dots, setDots] = useState('');

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Radar Animation Container */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-sm p-6 gap-12">
        
        {/* Animated Rings */}
        <div className="relative w-48 h-48 flex items-center justify-center">
           {/* Center avatar/icon */}
           <div className="absolute z-10 w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/40">
             <span className="text-primary-foreground font-black text-3xl">H</span>
           </div>

           {/* Radar pulses */}
           <div className="absolute inset-0 border-[3px] border-primary/40 rounded-full animate-ping duration-[3000ms]" />
           <div className="absolute inset-4 border-[2px] border-primary/30 rounded-full animate-ping duration-[3000ms] delay-500" />
           <div className="absolute inset-8 border-[1px] border-primary/20 rounded-full animate-ping duration-[3000ms] delay-1000" />
        </div>

        {/* Text content */}
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold text-foreground text-center">
            Finding opponent<span className="inline-block w-6 text-left">{dots}</span>
          </h2>
          
          <div className="flex items-center justify-center gap-4 bg-card border border-border px-6 py-3 rounded-full shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground font-medium">
                <span className="text-foreground font-bold">{playersOnline}</span> online
              </span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm text-muted-foreground font-medium">
                <span className="text-foreground font-bold">{activeGames}</span> live games
              </span>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <Button 
          variant="destructive" 
          size="lg" 
          onClick={onCancel}
          className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-destructive/20 transition-all mt-4"
        >
          <X className="w-6 h-6 mr-2" />
          Cancel Matchmaking
        </Button>
      </div>
    </div>
  );
}
