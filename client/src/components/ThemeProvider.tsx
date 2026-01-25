import { THEME } from '@/constants/constants';
import { useAppSelector } from '@/hooks/useTypedRedux';
import { useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector((state: { theme: { mode: string } }) => state.theme.mode);

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === THEME.DARK) {
      root.classList.add(THEME.DARK);
    } else {
      root.classList.remove(THEME.DARK);
    }
  }, [theme]);

  return <>{children}</>;
}