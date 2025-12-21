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
    <Card className="bg-card/80 backdrop-blur-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold text-foreground">
              {score}/{wicketsLost}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {ballsPlayed}/{totalBalls} balls
            </div>
          </div>
          <div className="text-right text-sm space-y-1.5">
            <div className="text-muted-foreground">
              RR: <span className="font-semibold text-foreground">{runRate}</span>
            </div>
            <div className="text-muted-foreground">
              Left: <span className="font-semibold text-foreground">{ballsLeft}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Scoreboard;