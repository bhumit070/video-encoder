DO $$ BEGIN
 ALTER TABLE "video_jobs" ADD CONSTRAINT "video_jobs_parentVideoId_videos_id_fk" FOREIGN KEY ("parentVideoId") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
