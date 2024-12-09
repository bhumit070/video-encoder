import { useState } from "react";
import Navbar from "./Navbar";
import { APIS, apiV1Client } from "../helper/api";

function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const validMimeTypes = ["video/mp4", "video/webm", "video/x-matroska"];

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setUploadStatus(null);
      setUploadProgress(0);
    }
  };

  async function handleUpload() {
    if (!selectedFile) {
      setUploadStatus("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setIsUploading(true);
      const response = await apiV1Client.post(APIS.v1.UPLOAD_VIDEO, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          console.log({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
          });
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(progress);
        },
      });
      console.log(response);
    } catch (error) {
      setUploadStatus("Upload failed. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-gray-100 overflow-y-hidden">
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Upload Your Video</h1>
          <input
            type="file"
            accept={validMimeTypes.join(",")}
            onChange={handleFileChange}
            className="mb-4"
            disabled={isUploading}
          />
          {selectedFile && (
            <p className="text-sm text-gray-600 mb-4">
              Selected file: {selectedFile.name}
            </p>
          )}
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md transition hover:bg-blue-700 ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isUploading ? "Uploading..." : "Upload Video"}
          </button>
          {uploadProgress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{uploadProgress}%</p>
            </div>
          )}
          {uploadStatus && (
            <p
              className={`mt-4 text-sm ${
                uploadStatus === "Upload successful!"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {uploadStatus}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default Upload;
