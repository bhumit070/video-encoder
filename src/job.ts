import { exec } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

import { eq, isNull } from "drizzle-orm";

import { connectDB, db } from "./db";
import { videoJobs } from "./db/schema";

export const fileConversionCommands: Record<number, string> = {
  480: `ffmpeg -y -i "{{ORIGINAL_VIDEO_PATH}}" -vf scale=854:480 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -map 0 "{{DESTINATION_FILE_NAME}}"`,
  360: `ffmpeg -y -i "{{ORIGINAL_VIDEO_PATH}}" -vf scale=640:360 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -map 0 "{{DESTINATION_FILE_NAME}}"`,
  240: `ffmpeg -y -i "{{ORIGINAL_VIDEO_PATH}}" -vf scale=426:240 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -map 0 "{{DESTINATION_FILE_NAME}}"`,
  144: `ffmpeg -y -i "{{ORIGINAL_VIDEO_PATH}}" -vf scale=256:144 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -map 0 "{{DESTINATION_FILE_NAME}}"`,
};

function updateFileStatus(isRunning: boolean = false) {
  const filePath = path.join(__dirname, "task.json");

  let data = {
    isRunning,
  };
  if (fs.existsSync(filePath)) {
    try {
      const info = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      data = info;

      if (info.isRunning === isRunning) {
        console.log("Job is already running");
        return true;
      }

      data.isRunning = isRunning;
    } catch {
      data = {
        isRunning,
      };
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data));
}

async function main() {
  const isRunning = updateFileStatus(true);

  if (isRunning) {
    return;
  }

  const pendingVideo = await db
    .select()
    .from(videoJobs)
    .where(isNull(videoJobs.url))
    .limit(1);

  if (!pendingVideo.length) {
    return;
  }

  const videoInfo = pendingVideo[0];

  let command = fileConversionCommands[videoInfo.resolution] as string;

  if (!command) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const splittedLocalPath = videoInfo.localPath.split(".");
    const ext = splittedLocalPath.pop();
    splittedLocalPath.push(`-${videoInfo.resolution}`);
    splittedLocalPath.push(`.${ext}`);
    const outputPath = splittedLocalPath.join("");
    command = command
      .replace("{{ORIGINAL_VIDEO_PATH}}", videoInfo.localPath)
      .replace("{{DESTINATION_FILE_NAME}}", outputPath);

    const process = exec(command, async (error, stdout, stderr) => {
      if (error || stderr) {
        return reject(error || stderr);
      }

      await db
        .update(videoJobs)
        .set({
          url: outputPath,
        })
        .where(eq(videoJobs.id, videoJobs.id));

      resolve();

      process.on("message", console.info);
      process.on("close", (code) => {
        console.log({ code });
        updateFileStatus(false);
        console.log("process closed", code);
      });
      process.on("exit", (exitCode) => {
        console.log({ exitCode });
        updateFileStatus(false);
        console.log("process exited");
      });
    });
  });

  updateFileStatus(false);
}

connectDB()
  .then(() => {
    updateFileStatus();
    console.log("job is running");
    setInterval(main, 60 * 1_000);
  })
  .catch(console.error);

process.on("uncaughtException", updateFileStatus);
process.on("unhandledRejection", updateFileStatus);
