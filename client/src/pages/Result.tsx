import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useTypedRedux";
import { setLastGameId } from "../store/slices/sessionSlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Result() {
  const { matchId } = useParams<{ matchId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const game = useAppSelector((s) => s.game);
  const myResult = game?.result;

  const playAgain = () => {
    dispatch(setLastGameId(null));
    navigate("/");
  };

  const getResultContent = () => {
    switch (myResult) {
      case "won":
        return {
          emoji: "🎉",
          title: "Victory!",
          message: "Congratulations! You won the match!",
          bgClass: "bg-success/10 border-success/20",
          textClass: "text-success"
        };
      case "lost":
        return {
          emoji: "😿",
          title: "Defeat",
          message: "Better luck next time!",
          bgClass: "bg-destructive/10 border-destructive/20",
          textClass: "text-destructive"
        };
      case "tie":
        return {
          emoji: "🤝",
          title: "Draw",
          message: "It's a tie! Well played!",
          bgClass: "bg-warning/10 border-warning/20",
          textClass: "text-warning"
        };
      default:
        return {
          emoji: "🏏",
          title: "Match Finished",
          message: "The game has ended.",
          bgClass: "bg-muted border-border",
          textClass: "text-muted-foreground"
        };
    }
  };

  const resultContent = getResultContent();

  return (
    <div className="flex bg-background text-foreground items-center justify-center h-[100vh] p-4">
      <Card className={`w-full max-w-lg bg-card border-border shadow-lg ${resultContent.bgClass}`}>
        <CardHeader className="text-center space-y-2">
          <div className="text-6xl mb-4">{resultContent.emoji}</div>
          <CardTitle className={`text-3xl font-bold ${resultContent.textClass}`}>
            {resultContent.title}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Match ID: <span className="font-mono">{matchId}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          <p className="text-lg text-foreground font-medium">
            {resultContent.message}
          </p>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={playAgain}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg font-semibold w-full sm:w-auto"
          >
            Play Again
          </Button>
          
          <Button
            onClick={() => navigate("/leaderboard")}
            variant="outline"
            size="lg"
            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg font-medium w-full sm:w-auto"
          >
            View Leaderboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}