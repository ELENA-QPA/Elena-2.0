// Interfaces para el manejo de archivos
export interface FileUploadData {
  originalName: string;
  filename: string;
  size: number;
  mimetype: string;
  url: string;
  s3Key: string;
}

export interface SingleFileUploadResponse {
  success: boolean;
  message: string;
  data: FileUploadData;
}

export interface MultipleFileUploadResponse {
  success: boolean;
  message: string;
  data: FileUploadData[];
  count: number;
}

export interface DeleteFileResponse {
  success: boolean;
  message: string;
}

export interface FileInfoResponse {
  allowedMimeTypes: string[];
  maxFileSize: string;
  maxFiles: number;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
