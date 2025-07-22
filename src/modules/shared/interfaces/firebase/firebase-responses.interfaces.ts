export interface ImageInfo {
  name: string;
  size: number;
  contentType: string;
  created: string;
  updated: string;
  publicUrl: string;
}

export interface HealthCheckSuccess {
  status: 'ok';
  message: string;
  details: {
    bucketName: string;
    maxSizeMB: number;
    maxFiles: number;
    allowedTypes: string[];
  };
}

export interface HealthCheckError {
  status: 'error';
  message: string;
  details: {
    bucketName: string;
    error: string;
  };
} 