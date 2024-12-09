import { useEffect, useRef, useState } from "react";

import ReactModal from "react-modal";
import "video.js/dist/video-js.css";

import { APIS, apiV1Client } from "../helper/api";
import type { ApiResponse, GetVideoData } from "../types/api";

import videojs from "video.js";
import Player from "video.js/dist/types/player";

interface VideoComponent {
  selectedValue: string;
}

function Videos(props: VideoComponent) {
  const [videos, setVideos] = useState<Array<GetVideoData>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<GetVideoData | null>(null);
  const videoNode = useRef<HTMLVideoElement>(null);

  const openModal = (video: GetVideoData) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  async function getVideos() {
    if (loading) {
      return;
    }
    try {
      setLoading(true);
      setVideos([]);
      const response = await apiV1Client.get<ApiResponse<Array<GetVideoData>>>(
        APIS.v1.GET_VIDEOS,
        {
          params: {
            status: props.selectedValue,
          },
        }
      );
      setVideos(response.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedValue]);

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
      player.src({ type: "application/x-mpegURL", src: selectedVideo?.url });

      console.log(videoNode.current);
    }, 0);

    return () => player?.dispose?.();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex text-center w-full justify-center gap-4">
        <h1 className="text-2xl font-bold mb-3">Video List</h1>
        <h1
          className="text-2xl font-bold mb-3 cursor-pointer"
          onClick={getVideos}
        >
          Refresh List
        </h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto">
        {loading ? (
          <h2 className="text-lg font-semibold text-gray-800">Loading...</h2>
        ) : videos.length ? (
          videos.map((video) => (
            <div key={video.id} className="bg-white shadow-md rounded-lg">
              {/* Thumbnail */}
              <video
                className="w-full h-48 object-cover bg-gray-200"
                src={video.url}
              ></video>

              {/* Video Details */}
              <div className="flex flex-wrap gap-4">
                <div className="p-4 h-full flex flex-col justify-between bg-white shadow-md rounded-md max-w-xs w-full">
                  <h2
                    title={video.fileName}
                    className="text-lg font-semibold text-gray-800 break-words text-ellipsis overflow-hidden whitespace-nowrap"
                  >
                    {video.fileName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {video.isProcessed ? "Processed" : "Pending"}
                  </p>
                  <button
                    onClick={() => openModal(video)}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Watch Video
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <h2 className="text-lg font-semibold text-gray-800">
            No videos found.
          </h2>
        )}
      </div>

      {/* Modal */}
      <ReactModal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Video Player"
        className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-75"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        ariaHideApp={false}
      >
        {selectedVideo && (
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedVideo.fileName}
              </h2>
            </div>
            <div className="video-container">
              <video
                id="video-player"
                className="video-js vjs-default-skin w-full"
                controls
                preload="auto"
                ref={videoNode}
              >
                <source src={selectedVideo.url} type="application/x-mpegURL" />
              </video>
            </div>
            <div className="p-4 text-right">
              <button
                onClick={closeModal}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </ReactModal>
    </div>
  );
}

export default Videos;
