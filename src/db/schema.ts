import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  url: text("url").unique().notNull(),
  fileName: text("fileName").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
  resolution: integer("resolution").default(0),
  mimeType: text("mimeType").notNull(),
  isProcessed: boolean("isProcessed").default(false),
  availableVideoQualities: text("availableVideoQualities").notNull(),
  isVertical: boolean("isVertical").default(false),
});

export const jobTypeEnum = pgEnum("jobType", [
  "makeChunkVideos",
  "generateThumbnail",
  "scaleVideo",
]);

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  localPath: text("localPath").notNull(),
  resolution: integer("resolution").notNull(),
  url: text("url").unique(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
  mimeType: text("mimeType").notNull(),
  parentVideoId: integer("parentVideoId")
    .notNull()
    .references(() => videos.id),
  jobType: jobTypeEnum(),
});

// Types
export type InsertVideoType = InferInsertModel<typeof videos>;
export type SelectVideoType = InferSelectModel<typeof videos>;

export type InsertJobType = InferInsertModel<typeof jobs>;
export type SelectJobType = InferSelectModel<typeof jobs>;

export interface VideoWithJobs extends SelectVideoType {
  jobs: SelectJobType[];
}
