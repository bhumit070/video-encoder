import type { Readable } from "stream";

export type FileUploadParams = {
  bucket: string;
  filePath: string;
  mimeType: string;
  body: string | Uint8Array | Buffer | Readable;
};

export interface IStorage {
  upload(file: FileUploadParams): Promise<string>;
  download(fileId: string): Promise<string>;
  createBucket(bucketName: string): Promise<string>;
  isBucketExist(bucketName: string): Promise<boolean>;
  uploadFolder(
    bucketName: string,
    key: string,
    folderPath: string
  ): Promise<string>;
}

export abstract class CustomStorage implements IStorage {
  abstract upload(uploadParams: FileUploadParams): Promise<string>;
  abstract download(fileId: string): Promise<string>;
  abstract createBucket(bucketName: string): Promise<string>;
  abstract isBucketExist(bucketName: string): Promise<boolean>;
  abstract uploadFolder(
    bucketName: string,
    key: string,
    folderPath: string
  ): Promise<string>;
}
