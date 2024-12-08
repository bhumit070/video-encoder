import { Router } from "express";
const router = Router();
import { PromiseHandler } from "../../common/middlewares";
import { getVideos, uploadFile } from "./controllers";
import multer from "../../../helpers/multer";

router.post(
  "/upload",
  multer.upload.single("file"),
  PromiseHandler(uploadFile)
);

router.get("/videos", PromiseHandler(getVideos));

export default router;
