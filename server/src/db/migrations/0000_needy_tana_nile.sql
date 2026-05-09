CREATE TYPE "public"."end_reason" AS ENUM('COMPLETED', 'FORFEIT', 'TIMEOUT', 'DISCONNECT');--> statement-breakpoint
CREATE TYPE "public"."game_mode" AS ENUM('quick', 'classic', 'ranked');--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('IN_PROGRESS', 'COMPLETED', 'FORFEIT', 'TIMEOUT', 'DISCONNECT');--> statement-breakpoint
CREATE TYPE "public"."theme_mode" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_innings" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"inning_no" integer NOT NULL,
	"batsman_id" text NOT NULL,
	"bowler_id" text NOT NULL,
	"runs_scored" integer NOT NULL,
	"balls_played" integer NOT NULL,
	"wickets_lost" integer NOT NULL,
	"is_completed" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"user_id" text NOT NULL,
	"is_winner" boolean NOT NULL,
	"played_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" text PRIMARY KEY NOT NULL,
	"mode" "game_mode" NOT NULL,
	"max_balls" integer NOT NULL,
	"max_wickets" integer NOT NULL,
	"status" "game_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"winner_id" text,
	"end_reason" "end_reason",
	"total_balls" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"raw_snapshot" jsonb
);
--> statement-breakpoint
CREATE TABLE "player_stats" (
	"user_id" text NOT NULL,
	"mode" "game_mode" NOT NULL,
	"games_played" integer DEFAULT 0 NOT NULL,
	"games_won" integer DEFAULT 0 NOT NULL,
	"games_lost" integer DEFAULT 0 NOT NULL,
	"total_runs_scored" integer DEFAULT 0 NOT NULL,
	"total_balls_faced" integer DEFAULT 0 NOT NULL,
	"highest_score" integer DEFAULT 0 NOT NULL,
	"total_wickets_taken" integer DEFAULT 0 NOT NULL,
	"total_balls_bowled" integer DEFAULT 0 NOT NULL,
	"total_runs_conceded" integer DEFAULT 0 NOT NULL,
	"current_win_streak" integer DEFAULT 0 NOT NULL,
	"best_win_streak" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"achievement_id" text NOT NULL,
	"unlocked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"theme" "theme_mode" DEFAULT 'system' NOT NULL,
	"sound_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_innings" ADD CONSTRAINT "game_innings_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_innings" ADD CONSTRAINT "game_innings_batsman_id_user_id_fk" FOREIGN KEY ("batsman_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_innings" ADD CONSTRAINT "game_innings_bowler_id_user_id_fk" FOREIGN KEY ("bowler_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_winner_id_user_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "game_innings_game_inning_idx" ON "game_innings" USING btree ("game_id","inning_no");--> statement-breakpoint
CREATE UNIQUE INDEX "game_players_game_user_idx" ON "game_players" USING btree ("game_id","user_id");--> statement-breakpoint
CREATE INDEX "game_players_user_played_idx" ON "game_players" USING btree ("user_id","played_at");--> statement-breakpoint
CREATE UNIQUE INDEX "player_stats_user_mode_idx" ON "player_stats" USING btree ("user_id","mode");--> statement-breakpoint
CREATE UNIQUE INDEX "user_achievements_user_achievement_idx" ON "user_achievements" USING btree ("user_id","achievement_id");