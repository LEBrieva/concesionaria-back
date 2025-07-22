export interface ImageUploadResult {
  url: string;
  path: string;
  fileName: string;
  size: number;
}

export interface ImageUploadOptions {
  folder?: string;
  maxSizeInMB?: number;
  allowedTypes?: string[];
  generateThumbnail?: boolean;
} 