import { useEffect, useRef } from "react";

import videojs from "video.js";
import "video.js/dist/video-js.css";

import type Player from "video.js/dist/types/player";
import type { GetVideoData } from "../types/api";

interface VideoPlayerProps {
  video: GetVideoData;
  closeModal: () => void;
}

function VideoPlayer(props: VideoPlayerProps) {
  const { video, closeModal } = props;
  const videoNode = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let player: Player;

    setTimeout(() => {
      if (!videoNode.current) {
        return;
      }

      player = videojs(videoNode.current!, {
        controls: true,
        preload: "auto",
        fluid: true,
        controlBar: {
          children: [
            "playToggle",
            "volumePanel",
            "currentTimeDisplay",
            "timeDivider",
            "durationDisplay",
            "progressControl",
            "fullscreenToggle",
            "qualitySelector", // Add the quality selector to the control bar
          ],
        },
      });

      // Set the video source dynamically
      player.src({ type: "application/x-mpegURL", src: video?.url });

      console.log(videoNode.current);
    }, 0);

    return () => player?.dispose?.();
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
