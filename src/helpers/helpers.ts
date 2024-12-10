import { exec } from "node:child_process";
import { z } from "zod";

import type { Request } from "express";
import { CustomError } from "../errors/error";
import { InsertJobType, jobs } from "../db/schema";
import { db } from "../db";

const resolutions = [144, 240, 360, 480, 720, 1080, 1440, 2160];

const FfProbeResponse = z.object({
  streams: z.array(
    z.object({
      width: z.preprocess((val) => Number(val), z.number()),
      height: z.preprocess((val) => Number(val), z.number()),
    })
  ),
});

type TStreams = z.infer<typeof FfProbeResponse>;

async function checkVideoResolution(
  obj: Express.Multer.File
): Promise<TStreams> {
  const filePath = obj.path;

  const command = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json "${filePath}"`;

  return new Promise((resolve, reject) => {
    exec(command, async (error, stdout, stderr) => {
      if (error || stderr) {
        return reject(error || stderr);
      }

      try {
        const data = JSON.parse(stdout);
        const response = (await FfProbeResponse.parseAsync(
          data
        )) as unknown as TStreams;
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  });
}

type VideoEncodingInfo = {
  name: string;
  width: number;
  height: number;
  bitrate: string;
  audioBitrate: string;
};

function getResolutionInfo(resolution: number): VideoEncodingInfo {
  const obj: Record<string, VideoEncodingInfo> = {
    720: {
      name: "720p",
      width: 1280,
      height: 720,
      bitrate: "2800k",
      audioBitrate: "192k",
    },
    480: {
      name: "480p",
      width: 854,
      height: 480,
      bitrate: "1400k",
      audioBitrate: "128k",
    },
    360: {
      name: "360p",
      width: 640,
      height: 360,
      bitrate: "800k",
      audioBitrate: "96k",
    },
    240: {
      name: "240p",
      width: 426,
      height: 240,
      bitrate: "400k",
      audioBitrate: "64k",
    },
  };

  const info = obj[resolution];

  if (!info) {
    throw new Error("Resolution info not found");
  }

  return info;
}

function getLowerResolutions(startResolution: number) {
  const startIndex = resolutions.indexOf(startResolution);

  if (startIndex === -1) {
    return [];
  }

  return resolutions.slice(0, startIndex + 1).reverse();
}

async function getVideoResolution(
  req: Request
): Promise<[number, Array<number>]> {
  if (!req.file) {
    throw new CustomError("File is required", 400);
  }

  const resolutionInfo = await checkVideoResolution(req.file);
  const height = resolutionInfo?.streams?.[0]?.height || 0;
  const width = resolutionInfo?.streams?.[0]?.width || 0;

  if (!height) {
    throw new CustomError("Video file is invalid", 400);
  }

  if (height > width) {
    throw new CustomError("Vertical videos are not supported currently", 400);
  }

  const lowerResolutions = getLowerResolutions(height);

  if (!lowerResolutions.length) {
    throw new CustomError(
      `Please upload videos in one of the following qualities: ${resolutions.join(",")}`,
      400
    );
  }

  return [height, lowerResolutions];
}

async function addVideoJobs(
  lowerResolutions: Array<number>,
  insertedId: number,
  file: Express.Multer.File
) {
  const videoJobsObj: Array<InsertJobType> = [];

  for (let i = 0; i < lowerResolutions.length; i += 1) {
    const resolution = lowerResolutions[i];
    const obj: InsertJobType = {
      resolution,
      localPath: file.path,
      mimeType: file.mimetype,
      parentVideoId: insertedId,
      jobType: "makeChunkVideos",
    };
    videoJobsObj.push(obj);
  }

  await db.insert(jobs).values(videoJobsObj);
}

export default {
  checkVideoResolution,
  getLowerResolutions,
  getResolutionInfo,
  getVideoResolution,
  addVideoJobs,
};
