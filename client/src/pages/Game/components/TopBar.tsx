interface TopBarProps {
  matchId: string;
  currentInning: number;
  totalInnings: number;
  onLeaveGame: () => void;
}

function TopBar({ matchId, currentInning, totalInnings, onLeaveGame }: TopBarProps) {
  return (
    <div className="flex justify-between items-center px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border">
      <button
        onClick={onLeaveGame}
        className="px-4 py-2 rounded-lg font-semibold bg-destructive text-destructive-foreground hover:opacity-90 transition-all duration-200 shadow-sm text-sm"
      >
        Quit
      </button>
      <div className="text-xs font-mono text-muted-foreground">
        Match ID: {matchId}
      </div>
      <div className="bg-secondary px-3 py-1.5 rounded-lg text-sm text-secondary-foreground font-medium">
        Inning {currentInning + 1}/{totalInnings}
      </div>
    </div>
  );
}

export default TopBar;