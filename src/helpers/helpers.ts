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

  const command = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json ${filePath}`;

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

function getLowerResolutions(startResolution: number) {
  const resolutions = [144, 240, 360, 480, 720, 1080, 1440, 2160]; // Standard resolutions
  const startIndex = resolutions.indexOf(startResolution);

  // If the input resolution is not valid or not found in the list
  if (startIndex === -1) {
    return [];
  }

  // Return all resolutions below the starting resolution
  return resolutions.slice(0, startIndex).reverse();
}

export default {
  checkVideoResolution,
  getLowerResolutions,
};
