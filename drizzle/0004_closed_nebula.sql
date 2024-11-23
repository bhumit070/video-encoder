CREATE TABLE IF NOT EXISTS "video_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"localPath" text NOT NULL,
	"resolution" integer NOT NULL,
	"url" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "video_jobs_localPath_unique" UNIQUE("localPath"),
	CONSTRAINT "video_jobs_url_unique" UNIQUE("url")
);
