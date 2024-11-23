import express, { Application } from "express";
import routes from "./index";
import { handleApiError, routeNotFound } from "./common/controllers";
import { PromiseHandler } from "./common/middlewares";

export function registerMiddlewares(app: Application) {
  app.use(express.json());
}

export function registerRoutes(app: Application) {
  app
    .use("/api", routes)
    .use(PromiseHandler(routeNotFound))
    .use(handleApiError);
}
