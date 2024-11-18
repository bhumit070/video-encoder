import { Request, Response } from "express";

import response from "../../../helpers/response";
import { CustomError } from "../../../errors/error";
import { StorageFactory } from "../../../cloud/storage";
import { config } from "../../../config/config";
import { db } from "../../../db";
import { videos } from "../../../db/schema";
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

  const lowerResolutions = helpers.getLowerResolutions(resolution);

  const storage = StorageFactory.createStorage("aws");
  const fileName = req.file.filename || req.file.originalname;
  const location = await storage.upload({
    body: req.file.buffer,
    bucket: config.AWS_DEFAULT_BUCKET,
    filePath: `videos/${encodeURIComponent(fileName)}`,
    mimeType: req.file.mimetype,
  });

  await db.insert(videos).values({
    fileName,
    url: location,
    resolution,
  });

  return response.success({
    res,
    message: `This is message`,
    data: {
      location,
    },
  });
}
