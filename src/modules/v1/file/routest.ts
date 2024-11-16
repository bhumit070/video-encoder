import { Router } from "express";
const router = Router();
import { PromiseHandler } from "../../common/middlewares";
import { generatePreSignURLForFileUpload } from "./controllers";

router.post("/upload", PromiseHandler(generatePreSignURLForFileUpload));

export default router;
