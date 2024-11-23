import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  url: text("url").unique().notNull(),
  fileName: text("fileName").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
  resolution: integer("resolution").default(0),
});

export const videoJobs = pgTable("video_jobs", {
  id: serial("id").primaryKey(),
  localPath: text("localPath").notNull(),
  resolution: integer("resolution").notNull(),
  url: text("url").unique(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

export type TVideoJob = typeof videoJobs;
