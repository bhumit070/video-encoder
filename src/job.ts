import { exec } from "node:child_process";
import fs from "node:fs";

import { eq, isNull } from "drizzle-orm";

import { connectDB, db } from "./db";
import { videoJobs } from "./db/schema";
import { StorageFactory } from "./cloud/storage";
import { config } from "./config/config";

export const fileConversionCommands: Record<number, string> = {
  480: `ffmpeg -y -i "{{ORIGINAL_VIDEO_PATH}}" -vf scale=854:480 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -map 0 "{{DESTINATION_FILE_NAME}}" > /dev/null 2>&1`,
  360: `ffmpeg -y -i "{{ORIGINAL_VIDEO_PATH}}" -vf scale=640:360 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -map 0 "{{DESTINATION_FILE_NAME}}" > /dev/null 2>&1`,
  240: `ffmpeg -y -i "{{ORIGINAL_VIDEO_PATH}}" -vf scale=426:240 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -map 0 "{{DESTINATION_FILE_NAME}}" > /dev/null 2>&1`,
  144: `ffmpeg -y -i "{{ORIGINAL_VIDEO_PATH}}" -vf scale=256:144 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -map 0 "{{DESTINATION_FILE_NAME}}" > /dev/null 2>&1`,
};

const taskStatus = {
  isRunning: false,
};

function updateFileStatus(isRunning: boolean = false) {
  console.log(taskStatus);
  if (taskStatus.isRunning === isRunning) {
    return true;
  }

  taskStatus.isRunning = isRunning;
  return false;

  //const filePath = path.join(process.cwd(), "task.json");
  //let data = {
  //  isRunning,
  //};
  //if (fs.existsSync(filePath)) {
  //  try {
  //    const info = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  //    data = info;
  //    if (info.isRunning === isRunning) {
  //      console.log("Job is already running");
  //      return true;
  //    }
  //    data.isRunning = isRunning;
  //  } catch {
  //    data = {
  //      isRunning,
  //    };
  //  }
  //}
  //fs.writeFileSync(filePath, JSON.stringify(data));
}

async function main() {
  const isRunning = updateFileStatus(true);
  console.log({ isRunning });

  if (isRunning) {
    console.log("Job is already running");
    return;
  }

  const pendingVideo = await db
    .select()
    .from(videoJobs)
    .where(isNull(videoJobs.url))
    .limit(1);

  if (!pendingVideo.length) {
    updateFileStatus(false);
    return;
  }

  const videoInfo = pendingVideo[0];

  let command = fileConversionCommands[videoInfo.resolution] as string;

  if (!command) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    let splittedLocalPath = videoInfo.localPath.split(".");
    const ext = splittedLocalPath.pop();
    splittedLocalPath = splittedLocalPath.join("").split("-");
    splittedLocalPath.pop();
    splittedLocalPath.push(`-${videoInfo.resolution}`);
    splittedLocalPath.push(`.${ext}`);
    const outputPath = splittedLocalPath.join("");
    command = command
      .replace("{{ORIGINAL_VIDEO_PATH}}", videoInfo.localPath)
      .replace("{{DESTINATION_FILE_NAME}}", outputPath);

    console.log(`Executing command ${command}`);
    const process = exec(command, async (error, stdout, stderr) => {
      if (error || stderr) {
        updateFileStatus(false);
        return reject(error || stderr);
      }

      const storage = StorageFactory.createStorage("aws");

      const url = await storage.upload({
        body: await fs.promises.readFile(outputPath),
        bucket: config.AWS_DEFAULT_BUCKET,
        filePath: `videos/${outputPath.split("/").at(-1)!}`,
        mimeType: videoInfo.mimeType,
      });

      await db
        .update(videoJobs)
        .set({
          url,
        })
        .where(eq(videoJobs.id, videoInfo.id));

      await fs.promises.unlink(outputPath);

      updateFileStatus(false);
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
    console.log("job started");
    updateFileStatus();
    main();
    setInterval(main, 60 * 1_000);
  })
  .catch(console.error);

process.on("uncaughtException", () => updateFileStatus(false));
process.on("unhandledRejection", () => updateFileStatus(false));
