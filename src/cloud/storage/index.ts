import { AwsStorage } from "./aws";
import { CustomStorage } from "./types";

export class StorageFactory {
  static createStorage(type: string): CustomStorage {
    switch (type) {
      case "aws":
        return new AwsStorage();
      default:
        throw new Error("Unsupported storage type");
    }
  }
}
