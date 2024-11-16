import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  ListObjectsCommand,
  S3ClientConfig,
} from "@aws-sdk/client-s3";

import { CustomStorage, FileUploadParams } from "./types";
import { config } from "../../config/config";

export class AwsStorage extends CustomStorage {
  static #_instance: AwsStorage;

  #region = "ap-south-1";
  #config: S3ClientConfig = {
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY,
      secretAccessKey: config.AWS_SECRET_KEY,
    },
    region: this.#region,
    endpoint: `http://${config.LOCAL_STACK_ENDPOINT_URL}:4566`,
  };
  #client = new S3Client(this.#config);

  constructor(forceNew?: boolean) {
    super();

    if (AwsStorage.#_instance && !forceNew) {
      return AwsStorage.#_instance;
    }

    AwsStorage.#_instance = this;

    return this;
  }

  async upload(params: FileUploadParams): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.filePath,
      Body: params.body,
    });

    await this.#client.send(command);

    return `http://localhost:4566/${params.bucket}/${params.filePath}`;
  }

  async createBucket(bucketName: string): Promise<string> {
    const command = new CreateBucketCommand({
      Bucket: bucketName,
    });

    const response = await this.#client.send(command);

    return response.Location || "";
  }

  async download(fileId: string): Promise<string> {
    return fileId;
  }

  async listFiles(bucket: string) {
    const command = new ListObjectsCommand({
      Bucket: bucket,
    });

    const response = await this.#client.send(command);

    return response;
  }
}
