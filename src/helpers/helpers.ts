import { exec } from "node:child_process";
import { z } from "zod";

const FfProbeResponse = z.object({
  streams: z.array(
    z.object({
      width: z.preprocess((val) => Number(val), z.number()),
      height: z.preprocess((val) => Number(val), z.number()),
    })
  ),
});

type TStreams = z.infer<typeof FfProbeResponse>;

async function checkVideoResolution(
  obj: Express.Multer.File
): Promise<TStreams> {
  const filePath = obj.path;

  const command = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json "${filePath}"`;

  return new Promise((resolve, reject) => {
    exec(command, async (error, stdout, stderr) => {
      if (error || stderr) {
        return reject(error || stderr);
      }

      try {
        const data = JSON.parse(stdout);
        const response = (await FfProbeResponse.parseAsync(
          data
        )) as unknown as TStreams;
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  });
}

type VideoEncodingInfo = {
  name: string;
  width: number;
  height: number;
  bitrate: string;
  audioBitrate: string;
};

function getResolutionInfo(resolution: number): VideoEncodingInfo {
  const obj: Record<string, VideoEncodingInfo> = {
    720: {
      name: "720p",
      width: 1280,
      height: 720,
      bitrate: "2800k",
      audioBitrate: "192k",
    },
    480: {
      name: "480p",
      width: 854,
      height: 480,
      bitrate: "1400k",
      audioBitrate: "128k",
    },
    360: {
      name: "360p",
      width: 640,
      height: 360,
      bitrate: "800k",
      audioBitrate: "96k",
    },
    240: {
      name: "240p",
      width: 426,
      height: 240,
      bitrate: "400k",
      audioBitrate: "64k",
    },
  };

  const info = obj[resolution];

  if (!info) {
    throw new Error("Resolution info not found");
  }

  return info;
}

function getLowerResolutions(startResolution: number) {
  const resolutions = [144, 240, 360, 480, 720, 1080, 1440, 2160]; // Standard resolutions
  const startIndex = resolutions.indexOf(startResolution);

  // If the input resolution is not valid or not found in the list
  if (startIndex === -1) {
    return [];
  }

  // Return all resolutions below the starting resolution
  return resolutions.slice(0, startIndex + 1).reverse();
}

export default {
  checkVideoResolution,
  getLowerResolutions,
  getResolutionInfo,
};
