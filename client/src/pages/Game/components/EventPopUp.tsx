import { useState, useEffect } from 'react';

interface EventPopupProps {
  event: number | null;
  onComplete?: () => void;
}
const EventPopup = ({ event, onComplete }: EventPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (event !== null) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [event, onComplete]);

  if (event === null) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div
        className={` bg-gradient-to-r from-purple-600 to-pink-600 text-white
          h-24 w-24 flex justify-center items-center rounded-full shadow-2xl top-1/2 -translate-y-1/2  absolute left-1/2 -translate-x-1/2
          transform transition-all duration-300 ease-out text-6xl font-bold uppercase tracking-wider
          ${isVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
        `}
      >
        <div>
          {event}
        </div>
      </div>
    </div>
  );
};

export default EventPopup;