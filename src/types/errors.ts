export interface ResponseError {
  error_code?: string;
  http_code: string;
  message: string;
  data?: any;
}
