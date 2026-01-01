import { Card, CardContent } from "@/components/ui/card";

interface ScoreboardProps {
  score: number;
  wicketsLost: number;
  ballsPlayed: number;
  totalBalls: number;
  ballsLeft: number;
}

function Scoreboard({ score, wicketsLost, ballsPlayed, totalBalls, ballsLeft }: ScoreboardProps) {
  const runRate = ((score / Math.max(ballsPlayed, 1)) * 6).toFixed(1);

  return (
    <Card className="bg-card/80 backdrop-blur-md py-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold text-foreground">
              {score}/{wicketsLost}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {`3.6 (5)`}
            </div>
          </div>
          <div className="text-right text-sm space-y-4">
            <div className="text-muted-foreground">
              RR: <span className="font-semibold text-foreground">{runRate}</span>
            </div>
            <div className="text-primary text-xs font-semibold font-mono">
              24 needed from 12 balls
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Scoreboard;