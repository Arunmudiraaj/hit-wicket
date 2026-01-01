import { Card, CardContent } from "@/components/ui/card";

interface Ball {
  ballNumber: number;
  batsmanChoice: number;
  bowlerChoice: number;
  outcome: "runs" | "wicket";
  runs: number;
}

interface BallHistoryProps {
  balls: Ball[];
}

function BallHistory({ balls }: BallHistoryProps) {
  const getBallStyle = (ball: Ball) => {
    if (ball.outcome === "wicket")
      return "bg-destructive text-destructive-foreground ring-2 ring-destructive/50";
    if (ball.runs === 4) return "bg-primary text-primary-foreground ring-2 ring-primary/50";
    if (ball.runs === 6)
      return "bg-primary text-primary-foreground ring-2 ring-primary/50";
    return "bg-accent text-accent-foreground ring-2 ring-accent/50";
  };

  return (
    <Card className="bg-card/80 backdrop-blur-md py-4">
      <CardContent className="p-4">
        <div className="text-sm mb-2 text-muted-foreground font-medium">
          Recent Balls
        </div>
        <div className="flex flex-wrap gap-1.5">
          {balls.length === 0 ? (
            <div className="text-sm text-muted-foreground">No balls yet</div>
          ) : (
            balls
              .slice(-8)
              .reverse()
              .map((ball) => (
                <div
                  key={ball.ballNumber}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${getBallStyle(
                    ball
                  )}`}
                >
                  {ball.outcome === "wicket" ? "W" : ball.runs}
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BallHistory;