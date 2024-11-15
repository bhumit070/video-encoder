import express from "express";
import { config } from "./config/config";
import "./db";

const app = express();

app.listen(config.PORT, () => {
  console.log(`App is running on ${config.PORT}`);
});
