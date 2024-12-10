CREATE TYPE "public"."jobType" AS ENUM('makeChunkVideos', 'generateThumbnail', 'scaleVideo');--> statement-breakpoint
ALTER TABLE "video_jobs" RENAME TO "jobs";--> statement-breakpoint
ALTER TABLE "jobs" DROP CONSTRAINT "video_jobs_url_unique";--> statement-breakpoint
ALTER TABLE "jobs" DROP CONSTRAINT "video_jobs_parentVideoId_videos_id_fk";
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "jobType" "jobType";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs" ADD CONSTRAINT "jobs_parentVideoId_videos_id_fk" FOREIGN KEY ("parentVideoId") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_url_unique" UNIQUE("url");