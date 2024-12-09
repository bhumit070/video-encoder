import fs from "node:fs";

import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { CustomError } from "../../errors/error";
import { response } from "../../helpers/";
import { CustomResponse } from "../../helpers/response";
import { config } from "../../config/config";

export async function routeNotFound() {
  throw new CustomError("Route not found", 404);
}

export async function handleApiError(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const payload = {
    code: 500,
    res,
    message: "Internal server error",
    data: config.NODE_ENV === "DEVELOPMENT" ? error.stack : null,
  } as Required<CustomResponse>;

  if (error instanceof CustomError) {
    payload.message = error.message;
    payload.code = error.code;
  }

  if (error instanceof ZodError) {
    payload.code = 422;
    payload.message = `Invalid data provided.`;
    const data: Record<string, string> = {};
    for (const key in error.formErrors.fieldErrors) {
      data[key] =
        error.formErrors.fieldErrors[key]?.join(", ") || "Invalid input.";
    }
    payload.data = data;
  }

  await cleanupFiles(req);

  response.error(payload);
}

async function cleanupFiles(req: Request) {
  if (req.file?.path) {
    if (fs.existsSync(req.file.path)) {
      await fs.promises.unlink(req.file.path);
    }
  }
}
