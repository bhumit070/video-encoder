import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  ListObjectsCommand,
  S3ClientConfig,
  HeadBucketCommand,
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

  async #createBucketIfNotExist(bucketName: string) {
    const isBucketExist = await this.isBucketExist(bucketName);

    if (!isBucketExist) {
      await this.createBucket(bucketName);
    }
  }

  async upload(params: FileUploadParams): Promise<string> {
    await this.#createBucketIfNotExist(params.bucket);

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

  async isBucketExist(bucketName: string): Promise<boolean> {
    let isBucketExist: boolean = false;
    try {
      const command = new HeadBucketCommand({ Bucket: bucketName });

      await this.#client.send(command);

      isBucketExist = true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === "NotFound") {
          isBucketExist = false;
        } else if (error.name === "Forbidden") {
          isBucketExist = false;
        } else {
          throw error;
        }
      }
    }

    return isBucketExist;
  }
}
