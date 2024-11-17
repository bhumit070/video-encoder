import { spawn } from "node:child_process";

async function checkVideoResolution(obj: Express.Multer.File) {
  const filePath = obj.path;

  const command = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json ${filePath}`;

  const process = spawn(command);

  return new Promise((resolve, reject) => {
    process.on("error", reject);
    process.on("message", resolve);
  });
}

export default {
  checkVideoResolution,
};
