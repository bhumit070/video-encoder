import { CustomStorage } from "./types";

export class AwsStorage extends CustomStorage {
  upload(file: string): void {
    console.log(file);
  }

  download(fileId: string): string {
    return fileId;
  }
}
