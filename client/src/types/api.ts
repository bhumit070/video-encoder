export interface ApiResponse<T = unknown> {
  data: T;
  code: number;
  message: string;
  error: boolean;
}

interface VideoJob {
  id: number;
  localPath: string;
  resolution: number;
  url: string;
}

export interface GetVideoData {
  id: number;
  url: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  resolution: number;
  mimeType: string;
  isProcessed: boolean;
  availableVideoQualities: string;
  jobs: Array<VideoJob>;
}
