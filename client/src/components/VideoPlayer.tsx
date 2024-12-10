import { useEffect, useRef } from "react";

import Hls from "hls.js";
import Plyr from "plyr";

import "plyr/dist/plyr.css";

import type { GetVideoData } from "../types/api";

interface VideoPlayerProps {
  video: GetVideoData;
  closeModal: () => void;
}

function VideoPlayer(props: VideoPlayerProps) {
  const { video, closeModal } = props;
  const videoNode = useRef<HTMLVideoElement>(null);

  async function setupHLSPlayer() {
    if (!Hls.isSupported() || videoNode.current === null) {
      return;
    }

    const player = await new Promise<Plyr | undefined>((resolve, reject) => {
      const hls = new Hls({
        debug: !true,
      });
      hls.loadSource(video.url);
      hls.attachMedia(videoNode.current!);
      hls.on(Hls.Events.ERROR, (...args) => {
        console.log(args);
        reject(args[1] || args[0]);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        /* TODO: this is hack to show video quality,
            Fix THIS FROM HLS JS */
        const availableQualities = video.availableVideoQualities
          .split(",")
          .map(Number);

        const player = new Plyr(videoNode.current!, {
          controls: [
            "play-large",
            "restart",
            "rewind",
            "play",
            "fast-forward",
            "progress",
            "current-time",
            "duration",
            "mute",
            "volume",
            "captions",
            "settings",
            "pip",
            "airplay",
            "fullscreen",
          ],
          quality: {
            default: availableQualities[0],
            forced: true,
            options: availableQualities,
            onChange(quality) {
              const qualityIndex = availableQualities.findIndex(
                (availableQuality) => quality === availableQuality
              );

              hls.currentLevel = qualityIndex >= 0 ? qualityIndex : 0;
            },
          },
        });

        resolve(player);
      });
    });

    return player;
  }

  useEffect(() => {
    let player: Plyr | undefined;

    setTimeout(async () => {
      player = await setupHLSPlayer();
    }, 0);

    return () => player?.destroy?.();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video]);

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {video.fileName}
        </h2>
      </div>
      <div className="video-container">
        <video
          id="video-player"
          className="video-js vjs-default-skin w-full"
          controls
          ref={videoNode}
          poster={`https://placehold.co/229x192?text=${video.fileName}`}
        >
          <source src={video.url} type="application/x-mpegURL" />
        </video>
      </div>
      <div className="p-4 text-center">
        <button
          onClick={closeModal}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default VideoPlayer;
