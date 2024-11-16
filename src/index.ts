import express from "express";
import { config } from "./config/config";
import { connectDB } from "./db";
import { registerMiddlewares, registerRoutes } from "./modules/middlewares";

Promise.all([connectDB]).then(bootstrapServer).catch(handleServerInitError);

function bootstrapServer() {
  const app = express();

  const PORT = config.PORT;

  registerMiddlewares(app);
  registerRoutes(app);

  app.listen(PORT, () => {
    console.info(`Server listening on port ${PORT}`);
  });
}

function handleServerInitError(e: unknown) {
  console.error("Error initializing server:", e);
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
