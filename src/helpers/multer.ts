import path from "node:path";
import multer from "multer";
import { CustomError } from "../errors/error";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destination = path.join(process.cwd(), "videos");
    cb(null, destination);
  },
  filename: function (req, file, cb) {
    const fileName = (file.filename || file.originalname)?.split(".");

    const fileExtension = fileName.at(-1);

    if (!fileExtension) {
      return cb(new CustomError("File extension is invalid", 400), "");
    }

    cb(null, `${Date.now()}.${fileExtension}`);
  },
});

const upload = multer({
  fileFilter(req, file, cb) {
    const validMimeTypes = ["video/mp4", "video/webm", "video/x-matroska"];

    if (file && !validMimeTypes.includes(file.mimetype)) {
      return cb(new CustomError("File type is invalid", 400));
    }
    cb(null, true);
  },
  //dest: ,
  storage,
});

export default {
  upload,
};
