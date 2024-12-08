export interface ApiResponse<T = unknown> {
  data: T;
  code: number;
  message: string;
  error: boolean;
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
}
