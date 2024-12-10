import fs from "node:fs/promises";
import path from "node:path";

import { Request, Response } from "express";
import { eq, isNull } from "drizzle-orm";

import response from "../../../helpers/response";
import { StorageFactory } from "../../../cloud/storage";
import { config } from "../../../config/config";
import { db } from "../../../db";
import helpers from "../../../helpers/helpers";
import { CustomError } from "../../../errors/error";
import { videos, jobs, SelectJobType, VideoWithJobs } from "../../../db/schema";

export async function uploadFile(req: Request, res: Response) {
  const [resolution, lowerResolutions] = await helpers.getVideoResolution(req);
  const file = req.file!;

  const storage = StorageFactory.createStorage("aws");
  const fileName = file.filename || file.originalname;
  const location = await storage.upload({
    body: file.buffer,
    bucket: config.AWS_DEFAULT_BUCKET,
    filePath: `videos/${fileName}`,
    mimeType: file.mimetype,
  });

  const insertResponse = await db
    .insert(videos)
    .values({
      fileName,
      url: location,
      resolution: resolution,
      mimeType: file.mimetype,
      availableVideoQualities: lowerResolutions.join(","),
    })
    .returning({
      insertedId: videos.id,
    });

  const insertedId = insertResponse?.[0]?.insertedId;

  if (!insertedId) {
    throw new CustomError("Failed to save the video", 500);
  }

  await fs.mkdir(path.join(process.cwd(), "videos", insertedId + ""), {
    recursive: true,
  });

  await helpers.addVideoJobs(lowerResolutions, insertedId, file);

  return response.success({
    res,
    message: `This is message`,
    data: {
      location,
      insertResponse,
    },
  });
}

export async function getVideos(req: Request, res: Response) {
  const isProcessed = req.query?.status !== "pending";

  const dbVideos = await db
    .select({
      video: videos,
      job: jobs,
    })
    .from(videos)
    .where(eq(videos.isProcessed, isProcessed))
    .leftJoin(
      jobs,
      (job) => eq(job.job.parentVideoId, videos.id) && isNull(job.job.url)
    );

  const groupedResults: VideoWithJobs[] = dbVideos.reduce<VideoWithJobs[]>(
    (acc, row) => {
      const { video, job } = row;

      let videoEntry = acc.find((v) => v.id === video.id);
      if (!videoEntry) {
        videoEntry = { ...video, jobs: [] } as VideoWithJobs;
        acc.push(videoEntry);
      }

      if (job && job.id !== null) {
        videoEntry.jobs.push(job as SelectJobType);
      }

      return acc;
    },
    []
  );

  return response.success({
    res,
    data: groupedResults,
  });
}
