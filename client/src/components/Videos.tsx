import { useEffect, useState } from "react";

import ReactModal from "react-modal";
import "video.js/dist/video-js.css";

import { APIS, apiV1Client } from "../helper/api";
import type { ApiResponse, GetVideoData } from "../types/api";

import VideoPlayer from "./VideoPlayer";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto h-auto pb-3">
        {loading ? (
          <h2 className="text-lg font-semibold text-gray-800">Loading...</h2>
        ) : videos.length ? (
          videos.map((video) => (
            <div key={video.id} className="bg-white shadow-md rounded-xl">
              {/* Thumbnail */}
              <img
                className="w-full h-48 object-cover bg-gray-200"
                src={`https://placehold.co/229x192?text=${video.fileName}`}
              ></img>

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
                    Uploaded On: {new Date(video.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Available Qualities: {video.availableVideoQualities}
                  </p>
                  {props.selectedValue === "pending" && (
                    <p className="text-sm text-gray-500">
                      Pending Jobs:{" "}
                      {video.jobs.map((v) => v.resolution).join(",")}
                    </p>
                  )}
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
            No {props.selectedValue} videos found.
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
          <VideoPlayer video={selectedVideo} closeModal={closeModal} />
        )}
      </ReactModal>
    </div>
  );
}

export default Videos;
