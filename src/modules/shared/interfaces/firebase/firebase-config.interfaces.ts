export interface FirebaseStorageConfig {
  bucketName: string;
  maxSizeMB: number;
  allowedTypes: string[];
  maxFiles: number;
}

export interface ValidationConfig {
  allowedTypes: string[];
  maxSizeInMB: number;
} 