ALTER TABLE "account" DROP CONSTRAINT "account_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "game_innings" DROP CONSTRAINT "game_innings_game_id_games_id_fk";
--> statement-breakpoint
ALTER TABLE "game_innings" DROP CONSTRAINT "game_innings_batsman_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "game_innings" DROP CONSTRAINT "game_innings_bowler_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "game_players" DROP CONSTRAINT "game_players_game_id_games_id_fk";
--> statement-breakpoint
ALTER TABLE "game_players" DROP CONSTRAINT "game_players_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "games" DROP CONSTRAINT "games_winner_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "player_stats" DROP CONSTRAINT "player_stats_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_achievements" DROP CONSTRAINT "user_achievements_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_settings" DROP CONSTRAINT "user_settings_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "player_stats_user_mode_idx";--> statement-breakpoint
ALTER TABLE "game_innings" ALTER COLUMN "batsman_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "game_innings" ALTER COLUMN "bowler_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_user_id_mode_pk" PRIMARY KEY("user_id","mode");--> statement-breakpoint
ALTER TABLE "player_stats" ADD COLUMN "games_drawn" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_innings" ADD CONSTRAINT "game_innings_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_innings" ADD CONSTRAINT "game_innings_batsman_id_user_id_fk" FOREIGN KEY ("batsman_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_innings" ADD CONSTRAINT "game_innings_bowler_id_user_id_fk" FOREIGN KEY ("bowler_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_winner_id_user_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;