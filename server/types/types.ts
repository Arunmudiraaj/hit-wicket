/**
 * Game Mode Configurations
 * Each mode defines the rules for a match type
 */

export interface GameMode {
    id: string;
    name: string;
    description: string;
    overs: number;
    ballsPerOver: number;
    wickets: number;
    isRanked: boolean;
}