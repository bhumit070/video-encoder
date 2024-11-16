import { Request, Response } from "express";
import response from "../../../helpers/response";
import { CustomError } from "../../../errors/error";
import { StorageFactory } from "../../../cloud/storage";
import { config } from "../../../config/config";

export async function uploadFile(req: Request, res: Response) {
  if (!req.file) {
    throw new CustomError("File is required", 400);
  }

  const storage = StorageFactory.createStorage("aws");

  const location = await storage.upload({
    body: req.file.buffer,
    bucket: config.AWS_DEFAULT_BUCKET,
    filePath: `videos/${encodeURIComponent(req.file.filename || req.file.originalname)}`,
    mimeType: req.file.mimetype,
  });

  return response.success({
    res,
    message: `This is message`,
    data: {
      location,
    },
  });
}
