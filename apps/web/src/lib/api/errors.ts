/**
 * Client error types matching API.md standard error envelope.
 */

export interface APIErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface APIErrorPayload {
  error: {
    code: string;
    message: string;
    details?: APIErrorDetail[];
  };
  requestId?: string;
}

export class APIClientError extends Error {
  public code: string;
  public details: APIErrorDetail[];
  public requestId?: string;
  public status: number;

  constructor(status: number, payload: APIErrorPayload) {
    super(payload.error?.message || "An unexpected API error occurred.");
    this.name = "APIClientError";
    this.status = status;
    this.code = payload.error?.code || "INTERNAL_ERROR";
    this.details = payload.error?.details || [];
    this.requestId = payload.requestId;
  }
}
