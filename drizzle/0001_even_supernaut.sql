ALTER TABLE "videos" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now();