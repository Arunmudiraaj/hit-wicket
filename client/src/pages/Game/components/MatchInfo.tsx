import { Card, CardContent } from "@/components/ui/card";

interface MatchInfoProps {
  role: string;
  opponent: string;
  selectedChoice: number | null;
  isChoiceSubmitted: boolean;
  onSubmitChoice: () => void;
}

function MatchInfo({
  role,
  opponent,
  selectedChoice,
  isChoiceSubmitted,
  onSubmitChoice,
}: MatchInfoProps) {
  return (
    <Card className="bg-card/80 backdrop-blur-md max-w-md w-full">
      <CardContent className="p-6">
        <div className="text-center space-y-3">
          <div className="text-sm text-muted-foreground">You are playing as</div>
          <div className="text-2xl font-bold text-primary capitalize">{role}</div>
          <div className="text-sm text-muted-foreground">
            vs <span className="font-semibold text-foreground">{opponent}</span>
          </div>

          {selectedChoice !== null && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-2">
                Selected Choice
              </div>
              <div className="text-4xl font-bold text-primary">
                {selectedChoice}
              </div>
              {!isChoiceSubmitted ? (
                <button
                  onClick={onSubmitChoice}
                  className="mt-3 px-6 py-2 rounded-lg font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200 shadow-sm"
                >
                  Submit Choice
                </button>
              ) : (
                <div className="mt-3 text-sm text-muted-foreground">
                  Waiting for opponent...
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MatchInfo;