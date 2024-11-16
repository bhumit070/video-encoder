import multer from "multer";
import { CustomError } from "../errors/error";

const upload = multer({
  fileFilter(req, file, cb) {
    const validMimeTypes = ["video/mp4", "video/webm", "video/x-matroska"];

    console.log({ mime: file.mimetype });

    if (file && !validMimeTypes.includes(file.mimetype)) {
      return cb(new CustomError("File type is invalid", 400));
    }
    cb(null, true);
  },
});

export default {
  upload,
};
