import { useEffect, useState } from "react";

import ReactModal from "react-modal";
import "video.js/dist/video-js.css";

import { APIS, apiV1Client } from "../helper/api";
import type { ApiResponse, GetVideoData } from "../types/api";

interface VideoComponent {
  selectedValue: string;
}

function Videos(props: VideoComponent) {
  const [videos, setVideos] = useState<Array<GetVideoData>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<GetVideoData | null>(null);

  const openModal = (video: GetVideoData) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  async function getVideos() {
    try {
      setLoading(true);
      setVideos([]);
      const response = await apiV1Client.get<ApiResponse<Array<GetVideoData>>>(
        APIS.v1.GET_VIDEOS
      );
      setVideos(response.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getVideos();
  }, [props.selectedValue]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-8">Video List</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <h2 className="text-lg font-semibold text-gray-800">Loading...</h2>
        ) : (
          videos.map((video) => (
            <div
              key={video.id}
              className="bg-white shadow-md rounded-lg overflow-hidden"
            >
              {/* Thumbnail */}
              <video
                className="w-full h-48 object-cover bg-gray-200"
                src={video.url}
              ></video>

              {/* Video Details */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800">
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
          ))
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
