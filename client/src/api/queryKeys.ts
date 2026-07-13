export const queryKeys = {
  profile: ['profile'] as const,
  leaderboard: (mode: string, period: string) => ['leaderboard', mode, period] as const,
};
