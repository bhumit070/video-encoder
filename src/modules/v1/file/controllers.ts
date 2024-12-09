import fs from "node:fs/promises";

import { Request, Response } from "express";

import response from "../../../helpers/response";
import { CustomError } from "../../../errors/error";
import { StorageFactory } from "../../../cloud/storage";
import { config } from "../../../config/config";
import { db } from "../../../db";
import { videos, videoJobs } from "../../../db/schema";
import helpers from "../../../helpers/helpers";
import path from "node:path";
import { eq, isNull } from "drizzle-orm";

export interface Video {
  id: number;
  url: string;
  fileName: string;
  createdAt: Date;
  updatedAt: Date;
  resolution: number;
  mimeType: string;
  isProcessed: boolean;
  availableVideoQualities: string;
}

// Define the type for a single VideoJob
export interface VideoJob {
  id: number;
  localPath: string;
  resolution: number;
  url: string | null; // Since `url` is optional
  createdAt: Date;
  updatedAt: Date;
  mimeType: string;
  parentVideoId: number;
}

// Define the type for the grouped result
export interface VideoWithJobs extends Video {
  jobs: VideoJob[];
}

export async function uploadFile(req: Request, res: Response) {
  if (!req.file) {
    throw new CustomError("File is required", 400);
  }

  const resolutionInfo = await helpers.checkVideoResolution(req.file);
  const resolution = resolutionInfo?.streams?.[0]?.height || 0;

  if (!resolution) {
    throw new CustomError("Video file is invalid", 400);
  }

  const outputPath = req.file.path;

  const lowerResolutions = helpers.getLowerResolutions(resolution);

  if (!lowerResolutions.length) {
    throw new CustomError("Invalid video", 400);
  }

  const storage = StorageFactory.createStorage("aws");
  const fileName = req.file.filename || req.file.originalname;
  const location = await storage.upload({
    body: req.file.buffer,
    bucket: config.AWS_DEFAULT_BUCKET,
    filePath: `videos/${fileName}`,
    mimeType: req.file.mimetype,
  });

  const insertResponse = await db
    .insert(videos)
    .values({
      fileName,
      url: location,
      resolution,
      mimeType: req.file.mimetype,
      availableVideoQualities: lowerResolutions.join(","),
    })
    .returning({
      insertedId: videos.id,
    });

  const insertedId = insertResponse?.[0]?.insertedId;

  if (insertedId) {
    await fs.mkdir(path.join(process.cwd(), "videos", insertedId + ""), {
      recursive: true,
    });

    const videoJobsObj = [];

    for (let i = 0; i < lowerResolutions.length; i += 1) {
      const resolution = lowerResolutions[i];
      const obj = {
        localPath: outputPath,
        resolution,
        mimeType: req.file.mimetype,
        parentVideoId: insertedId,
      };
      videoJobsObj.push(obj);
    }

    await db.insert(videoJobs).values(videoJobsObj);
  }

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
      job: videoJobs,
    })
    .from(videos)
    .where(eq(videos.isProcessed, isProcessed))
    .leftJoin(
      videoJobs,
      (job) => eq(job.job.parentVideoId, videos.id) && isNull(job.job.url)
    );

  const groupedResults: VideoWithJobs[] = dbVideos.reduce<VideoWithJobs[]>(
    (acc, row) => {
      const { video, job } = row;

      // Find or create the video entry in the accumulator
      let videoEntry = acc.find((v) => v.id === video.id);
      if (!videoEntry) {
        videoEntry = { ...video, jobs: [] } as VideoWithJobs;
        acc.push(videoEntry);
      }

      // Add the job to the jobs array if it exists (for left join results)
      if (job && job.id !== null) {
        videoEntry.jobs.push(job as VideoJob);
      }

      return acc;
    },
    [] // Initial empty array for the accumulator
  );

  return response.success({
    res,
    data: groupedResults,
  });
}
