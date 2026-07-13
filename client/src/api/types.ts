export interface UserProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    gamesDrawn: number;
    totalRunsScored: number;
    totalBallsFaced: number;
    highestScore: number;
    totalWicketsTaken: number;
    totalBallsBowled: number;
    totalRunsConceded: number;
    bestWinStreak: number;
    winRate: number;
    averageRuns: number;
    strikeRate: number;
    economyRate: number;
    avgWicketsPerMatch: number;
  };
  statsByMode: any[]; // We can type this strictly later if needed
  achievements: { achievementId: string; unlockedAt: string }[];
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  gamesPlayed: number;
  gamesWon: number;
  winPercentage?: number;
}

export interface LeaderboardResponse {
  mode: string;
  rows: LeaderboardRow[];
}
