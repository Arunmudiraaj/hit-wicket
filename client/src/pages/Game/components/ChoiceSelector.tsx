interface ChoiceSelectorProps {
  choices: number[];
  selectedChoice: number | null;
  canPlay: boolean;
  isChoiceSubmitted: boolean;
  onChoiceClick: (choice: number) => void;
}

function ChoiceSelector({
  choices,
  selectedChoice,
  canPlay,
  isChoiceSubmitted,
  onChoiceClick,
}: ChoiceSelectorProps) {
  return (
    <div className="px-4 py-6 bg-card/80 backdrop-blur-md border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-sm text-center text-muted-foreground mb-3 font-medium">
          Select your choice
        </div>
        <div className="grid grid-cols-5 gap-3">
          {choices.map((choice) => {
            const isSelected = selectedChoice === choice;
            return (
              <button
                key={choice}
                onClick={() => onChoiceClick(choice)}
                disabled={!canPlay || isChoiceSubmitted}
                className={`
                  aspect-square rounded-lg font-bold text-3xl transition-all shadow-sm
                  ${
                    isSelected
                      ? "bg-primary text-primary-foreground ring-2 ring-ring scale-105"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105"
                  }
                  ${
                    !canPlay || isChoiceSubmitted
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }
                  disabled:hover:scale-100
                `}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ChoiceSelector;