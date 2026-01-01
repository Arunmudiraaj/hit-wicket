interface ChoiceSelectorProps {
  choices: number[];
  canPlay: boolean;
  isChoiceSubmitted: boolean;
  onChoiceClick: (choice: number) => void;
}

function ChoiceSelector({
  choices,
  canPlay,
  isChoiceSubmitted,
  onChoiceClick,
}: ChoiceSelectorProps) {
  return (
    <div className="px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-5 gap-3">
          {choices.map((choice) => {
            return (
              <button
                key={choice}
                onClick={() => onChoiceClick(choice)}
                disabled={!canPlay || isChoiceSubmitted}
                className={`
                  aspect-square bg-background/30 text-black dark:text-white relative rounded-4xl font-bold text=black text-3xl transition-all shadow-sm hover:scale-110
                  ${
                    !canPlay || isChoiceSubmitted
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }
                  disabled:hover:scale-100
                `}
              >
                <img
                  src={`/cricket-ball.svg`}
                  alt={`${choice} runs`}
                  className="w-full h-full absolute top-0 left-0 pointer-events-none select-none"
                />
                <div className="relative z-10 text-4xl">{choice}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ChoiceSelector;