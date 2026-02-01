import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/useTypedRedux";
import { setLastGameId } from "../../store/slices/sessionSlice";
import { clearGame } from "../../store/slices/gameSlice";
import {
  selectGameId,
  selectGameResult,
  selectAllInnings,
  selectEndReason,
} from "../../store/selectors/gameSelectors";
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

  // Get from selectors (prefer Redux state if available, fallback to URL param)
  const gameId = useAppSelector(selectGameId) ?? matchId;
  const myResult = useAppSelector(selectGameResult);
  const innings = useAppSelector(selectAllInnings);
  const endReason = useAppSelector(selectEndReason);

  const playAgain = () => {
    dispatch(setLastGameId(null));
    dispatch(clearGame());
    navigate("/");
  };

  const getResultContent = () => {
    switch (myResult) {
      case "win":
        return {
          emoji: "🎉",
          title: "Victory!",
          message: "Congratulations! You won the match!",
          bgClass: "bg-success/10 border-success/20",
          textClass: "text-success"
        };
      case "loss":
        return {
          emoji: "😿",
          title: "Defeat",
          message: "Better luck next time!",
          bgClass: "bg-destructive/10 border-destructive/20",
          textClass: "text-destructive"
        };
      case "draw":
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

  // Build score summary
  const inning1 = innings[0];
  const inning2 = innings[1];

  return (
    <div className="flex bg-background text-foreground items-center justify-center h-[100vh] p-4">
      <Card className={`w-full max-w-lg bg-card border-border shadow-lg ${resultContent.bgClass}`}>
        <CardHeader className="text-center space-y-2">
          <div className="text-6xl mb-4">{resultContent.emoji}</div>
          <CardTitle className={`text-3xl font-bold ${resultContent.textClass}`}>
            {resultContent.title}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Match ID: <span className="font-mono">{gameId}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-lg text-foreground font-medium">
            {resultContent.message}
          </p>

          {/* Score Summary */}
          {(inning1 || inning2) && (
            <div className="flex justify-center gap-8 text-sm">
              {inning1 && (
                <div className="text-center">
                  <div className="text-muted-foreground">Inning 1</div>
                  <div className="text-2xl font-bold text-foreground">
                    {inning1.score}/{inning1.wicketsLost}
                  </div>
                </div>
              )}
              {inning2 && (
                <div className="text-center">
                  <div className="text-muted-foreground">Inning 2</div>
                  <div className="text-2xl font-bold text-foreground">
                    {inning2.score}/{inning2.wicketsLost}
                  </div>
                </div>
              )}
            </div>
          )}

          {endReason && endReason !== 'COMPLETED' && (
            <p className="text-sm text-muted-foreground">
              Ended by: {endReason.toLowerCase()}
            </p>
          )}
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