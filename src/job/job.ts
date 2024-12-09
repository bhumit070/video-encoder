import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { eq, isNull } from "drizzle-orm";
import mime from "mime-types";

import { connectDB, db } from "../db";
import { SelectJobType, jobs, videos } from "../db/schema";
import { StorageFactory } from "../cloud/storage";
import { config } from "../config/config";

type Resolution = {
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
  resolutionLabel: string;
};

const resolutionBandwidthMap: Record<string, string> = {
  "144p": "250000",
  "240p": "500000",
  "360p": "800000",
  "480p": "1200000",
  "720p": "2500000",
  "1080p": "5000000",
  "1440p": "8000000",
  "2160p": "15000000",
};

const resolutions: Resolution[] = [
  {
    width: 256,
    height: 144,
    videoBitrate: "250k",
    audioBitrate: "64k",
    resolutionLabel: "144p",
  },
  {
    width: 426,
    height: 240,
    videoBitrate: "500k",
    audioBitrate: "64k",
    resolutionLabel: "240p",
  },
  {
    width: 640,
    height: 360,
    videoBitrate: "800k",
    audioBitrate: "96k",
    resolutionLabel: "360p",
  },
  {
    width: 854,
    height: 480,
    videoBitrate: "1200k",
    audioBitrate: "128k",
    resolutionLabel: "480p",
  },
  {
    width: 1280,
    height: 720,
    videoBitrate: "2500k",
    audioBitrate: "128k",
    resolutionLabel: "720p",
  },
  {
    width: 1920,
    height: 1080,
    videoBitrate: "5000k",
    audioBitrate: "192k",
    resolutionLabel: "1080p",
  },
  {
    width: 2560,
    height: 1440,
    videoBitrate: "8000k",
    audioBitrate: "256k",
    resolutionLabel: "1440p",
  },
  {
    width: 3840,
    height: 2160,
    videoBitrate: "15000k",
    audioBitrate: "256k",
    resolutionLabel: "2160p",
  },
];

async function generateMasterPlaylist(parentVideoId: number) {
  const allVideos = await db
    .select()
    .from(jobs)
    .where(eq(jobs.parentVideoId, parentVideoId));

  let isAllVideosDone = allVideos.length ? true : false;

  const videoMap: Record<string, string> = {};
  let parentVideoPath: string = "";
  for (let i = 0; i < allVideos.length; i += 1) {
    if (!parentVideoPath) {
      parentVideoPath = allVideos[i].localPath;
    }

    if (!allVideos[i].url) {
      isAllVideosDone = false;
      break;
    }
    videoMap[`${allVideos[i].resolution!}p`] = allVideos[i].url!;
  }

  if (!isAllVideosDone) {
    return;
  }

  const masterPlaylistPath = path.join(
    process.cwd(),
    "videos",
    `${parentVideoId}`,
    "master.m3u8"
  );

  let masterPlaylistContent = "#EXTM3U\n";

  const resolutionFolders = allVideos;

  resolutionFolders.forEach(({ resolution }) => {
    const sResolution = `${resolution}p` as string;
    const bandwidth = resolutionBandwidthMap[sResolution];
    if (bandwidth) {
      masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${sResolution}\n`;
      masterPlaylistContent += `${videoMap[sResolution]}\n`;
    }
  });

  fs.writeFileSync(masterPlaylistPath, masterPlaylistContent);

  const storage = StorageFactory.createStorage("aws");

  const mimeType =
    mime.lookup(masterPlaylistPath) || "application/octet-stream";
  fs.unlinkSync(masterPlaylistPath);

  console.log({ mimeType });

  const url = await storage.upload({
    body: masterPlaylistContent,
    bucket: config.AWS_DEFAULT_BUCKET,
    filePath: `${parentVideoId}/master.m3u8`,
    mimeType,
  });

  if (parentVideoPath) {
    if (fs.existsSync(parentVideoPath)) {
      await fs.promises.unlink(parentVideoPath);
    }
  }

  const promises = [
    db
      .update(videos)
      .set({
        url,
        mimeType,
        isProcessed: true,
      })
      .where(eq(videos.id, parentVideoId))
      .returning({
        url: videos.url,
      }),
    db.delete(jobs).where(eq(jobs.parentVideoId, parentVideoId)),
    fs.promises.rm(path.join(process.cwd(), "videos", `${parentVideoId}`), {
      recursive: true,
    }),
  ];

  await Promise.all(promises);
}

function generateHlsCommand(
  originalVideoPath: string,
  segmentsPath: string,
  videoResolution: number
): string {
  const resolution = resolutions.find((res) => res.height === videoResolution);

  if (!resolution) {
    throw new Error(`Command not found`);
  }
  return `ffmpeg -y -i "${originalVideoPath}" -map 0 -s ${resolution.width}x${resolution.height} \
-c:v libx264 -b:v ${resolution.videoBitrate} -preset veryfast -c:a aac -b:a ${resolution.audioBitrate} \
-hls_time 10 -hls_list_size 0 -hls_segment_filename "${segmentsPath}/${resolution.resolutionLabel}_%03d.ts" \
-hls_flags independent_segments "${segmentsPath}/${resolution.resolutionLabel}.m3u8" > /dev/null 2>&1`;
}

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
  return false;
}

async function encodeVideoJob(videoInfo: SelectJobType) {
  const videosFolder = path.join(
    process.cwd(),
    "videos",
    `${videoInfo.parentVideoId}`
  );

  const segmentsPath = path.join(videosFolder, `${videoInfo.resolution}p`);

  const command = generateHlsCommand(
    videoInfo.localPath,
    segmentsPath,
    videoInfo.resolution
  );

  await new Promise<void>((resolve, reject) => {
    let splittedLocalPath = videoInfo.localPath.split(".");
    const ext = splittedLocalPath.pop();
    splittedLocalPath = splittedLocalPath.join("").split("-");
    splittedLocalPath.pop();
    splittedLocalPath.push(`-${videoInfo.resolution}`);
    splittedLocalPath.push(`.${ext}`);

    if (!fs.existsSync(segmentsPath)) {
      fs.mkdirSync(segmentsPath, {
        recursive: true,
      });
    }

    console.log(`Executing command ${command}`);
    const childProcess = exec(command, async (error, stdout, stderr) => {
      if (error || stderr) {
        console.log({ stdout, stderr });
        updateFileStatus(false);
        return reject(error || stderr);
      }

      const storage = StorageFactory.createStorage("aws");

      const m3u8FilePath = await storage.uploadFolder(
        config.AWS_DEFAULT_BUCKET,
        segmentsPath,
        `${videoInfo.parentVideoId}/${videoInfo.resolution}p`
      );

      await db
        .update(jobs)
        .set({
          url: m3u8FilePath,
        })
        .where(eq(jobs.id, videoInfo.id));

      await fs.promises.rm(segmentsPath, {
        recursive: true,
      });

      resolve();

      childProcess.on("message", console.info);
      childProcess.on("close", (code) => {
        console.log({ code });
        updateFileStatus(false);
        console.log("process closed", code);
      });
      childProcess.on("exit", (exitCode) => {
        console.log({ exitCode });
        updateFileStatus(false);
        console.log("process exited");
      });
    });
  });

  await generateMasterPlaylist(videoInfo.parentVideoId);
}

async function main() {
  const isRunning = updateFileStatus(true);

  if (isRunning) {
    console.log(`Job is already running`);
    return;
  }

  const pendingVideo = await db
    .select()
    .from(jobs)
    .where(isNull(jobs.url))
    .limit(1);

  if (!pendingVideo.length) {
    console.log(`Nothing to process...`);
    updateFileStatus(false);
    return;
  }

  const info = pendingVideo[0];

  await encodeVideoJob(info);

  updateFileStatus(false);
  console.log(`-`.repeat(50), "end");
}

connectDB()
  .then(() => {
    console.log("job started");
    updateFileStatus();
    main();
    setInterval(main, 10 * 1_000);
  })
  .catch(console.error);

process.on("uncaughtException", (e) => {
  console.error(e);
  updateFileStatus(false);
});
process.on("unhandledRejection", (e) => {
  console.error(e);
  updateFileStatus(false);
});
