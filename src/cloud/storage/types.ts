export interface IStorage {
  upload(file: string): void;
  download(fileId: string): string;
}

export abstract class CustomStorage implements IStorage {
  abstract upload(file: string): void;
  abstract download(fileId: string): string;
}
