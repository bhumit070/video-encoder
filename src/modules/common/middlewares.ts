import type { NextFunction, Request, Response } from "express";

export function PromiseHandler(
  callback: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    callback(req, res, next).catch(next);
  };
}
