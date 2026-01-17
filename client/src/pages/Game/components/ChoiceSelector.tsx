interface ChoiceSelectorProps {
  choices: number[];
  canPlay: boolean;
  isChoiceSubmitted: boolean;
  selectedChoice: number | null;
  onChoiceClick: (choice: number) => void;
  onSubmit: () => void;
}

function ChoiceSelector({
  choices,
  canPlay,
  isChoiceSubmitted,
  selectedChoice,
  onChoiceClick,
  onSubmit,
}: ChoiceSelectorProps) {
  return (
    <div className="px-4 py-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div className="grid grid-cols-5 gap-3">
          {choices.map((choice) => {
            const isSelected = selectedChoice === choice;
            return (
              <button
                key={choice}
                onClick={() => onChoiceClick(choice)}
                disabled={!canPlay || isChoiceSubmitted}
                className={`
                  aspect-square relative rounded-full font-bold text-3xl transition-all shadow-sm
                  ${isSelected
                    ? 'ring-4 ring-primary scale-110 z-10'
                    : 'hover:scale-105 bg-background/30'
                  }
                  ${(!canPlay || isChoiceSubmitted) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <img
                  src={`/cricket-ball.svg`}
                  alt={`${choice} runs`}
                  className="w-full h-full absolute top-0 left-0 pointer-events-none select-none"
                />
                <div className={`relative z-10 ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {choice}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onSubmit}
          disabled={selectedChoice === null || isChoiceSubmitted || !canPlay}
          className={`
            w-full py-3 rounded-xl font-bold text-xl transition-all
            ${selectedChoice !== null && !isChoiceSubmitted && canPlay
              ? 'bg-primary text-primary-foreground shadow-lg hover:brightness-110 active:scale-95'
              : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'}
          `}
        >
          {isChoiceSubmitted ? 'Waiting for Opponent...' : 'PLAY BALL'}
        </button>
      </div>
    </div>
  );
}

export default ChoiceSelector;