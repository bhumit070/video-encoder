CREATE TABLE IF NOT EXISTS "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"fileName" text NOT NULL,
	CONSTRAINT "videos_url_unique" UNIQUE("url")
);
