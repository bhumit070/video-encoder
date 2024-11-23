import fs from "node:fs/promises";

import { Request, Response } from "express";

import response from "../../../helpers/response";
import { CustomError } from "../../../errors/error";
import { StorageFactory } from "../../../cloud/storage";
import { config } from "../../../config/config";
import { db } from "../../../db";
import { videos, videoJobs } from "../../../db/schema";
import helpers from "../../../helpers/helpers";

export async function uploadFile(req: Request, res: Response) {
  if (!req.file) {
    throw new CustomError("File is required", 400);
  }

  const resolutionInfo = await helpers.checkVideoResolution(req.file);
  const resolution = resolutionInfo?.streams?.[0]?.height || 0;

  if (!resolution) {
    throw new CustomError("Video file is invalid", 400);
  }

  const splittedLocalPath = req.file.path.split(".");
  const ext = splittedLocalPath.pop();
  splittedLocalPath.push(`-${resolution}`);
  splittedLocalPath.push(`.${ext}`);
  const outputPath = splittedLocalPath.join("");

  await fs.rename(req.file.path, outputPath);

  const lowerResolutions = helpers.getLowerResolutions(resolution);

  const videoJobsObj = [];

  for (let i = 0; i < lowerResolutions.length; i += 1) {
    const resolution = lowerResolutions[i];
    const obj = {
      localPath: outputPath,
      resolution,
      mimeType: req.file.mimetype,
    };
    videoJobsObj.push(obj);
  }

  const storage = StorageFactory.createStorage("aws");
  const fileName = req.file.filename || req.file.originalname;
  const location = await storage.upload({
    body: req.file.buffer,
    bucket: config.AWS_DEFAULT_BUCKET,
    filePath: `videos/${encodeURIComponent(fileName)}`,
    mimeType: req.file.mimetype,
  });

  await Promise.all([
    await db.insert(videos).values({
      fileName,
      url: location,
      resolution,
      mimeType: req.file.mimetype,
    }),
    await db.insert(videoJobs).values(videoJobsObj),
  ]);

  return response.success({
    res,
    message: `This is message`,
    data: {
      location,
    },
  });
}
