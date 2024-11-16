import { Router } from "express";
const router = Router();
import { PromiseHandler } from "../../common/middlewares";
import { uploadFile } from "./controllers";
import multer from "../../../helpers/multer";

router.post(
  "/upload",
  multer.upload.single("file"),
  PromiseHandler(uploadFile)
);

export default router;
