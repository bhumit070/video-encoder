import express, { Application } from "express";
import cors from "cors";
import routes from "./index";
import { handleApiError, routeNotFound } from "./common/controllers";
import { PromiseHandler } from "./common/middlewares";

export function registerMiddlewares(app: Application) {
  app.use(express.json()).use(
    cors({
      origin: "*",
    })
  );
}

export function registerRoutes(app: Application) {
  app
    .use("/api", routes)
    .use(PromiseHandler(routeNotFound))
    .use(handleApiError);
}
