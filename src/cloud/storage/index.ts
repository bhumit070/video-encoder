import { AwsStorage } from "./aws";
import { CustomStorage } from "./types";

type CloudStorage = "aws" | "gcp" | "azure";

export class StorageFactory {
  static createStorage(type: CloudStorage, forceNew?: boolean): CustomStorage {
    switch (type) {
      case "aws":
        return new AwsStorage(forceNew);
      default:
        throw new Error("Unsupported storage type");
    }
  }
}
