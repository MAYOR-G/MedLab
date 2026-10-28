"""Standard application exceptions and error handling per API.md Section 2."""

import uuid

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str
    code: str | None = None


class ErrorEnvelope(BaseModel):
    code: str
    message: str
    details: list[ErrorDetail] = []


class APIErrorResponse(BaseModel):
    error: ErrorEnvelope
    requestId: str


class MedLabException(Exception):
    """Base exception for MedLab domain errors."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: list[ErrorDetail] | None = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []
        super().__init__(message)


class AuthenticationError(MedLabException):
    def __init__(
        self,
        message: str = "Authentication required",
        code: str = "AUTHENTICATION_REQUIRED",
    ):
        super().__init__(
            code=code, message=message, status_code=status.HTTP_401_UNAUTHORIZED
        )


class InvalidTokenError(MedLabException):
    def __init__(
        self,
        message: str = "Provided token is invalid or expired",
        code: str = "INVALID_TOKEN",
    ):
        super().__init__(
            code=code, message=message, status_code=status.HTTP_401_UNAUTHORIZED
        )


class AuthorizationError(MedLabException):
    def __init__(
        self,
        message: str = "You do not have permission to access this resource",
        code: str = "FORBIDDEN",
    ):
        super().__init__(
            code=code, message=message, status_code=status.HTTP_403_FORBIDDEN
        )


ForbiddenError = AuthorizationError


class NotFoundError(MedLabException):
    def __init__(
        self,
        message: str = "Requested resource not found",
        code: str = "RESOURCE_NOT_FOUND",
    ):
        super().__init__(
            code=code, message=message, status_code=status.HTTP_404_NOT_FOUND
        )


class ConflictError(MedLabException):
    def __init__(
        self,
        message: str = "Resource conflict or invalid state transition",
        code: str = "INVALID_STATE_TRANSITION",
    ):
        super().__init__(
            code=code, message=message, status_code=status.HTTP_409_CONFLICT
        )


class IdempotencyConflictError(MedLabException):
    def __init__(
        self,
        message: str = "Concurrent or conflicting idempotent request detected",
        code: str = "IDEMPOTENCY_CONFLICT",
    ):
        super().__init__(
            code=code, message=message, status_code=status.HTTP_409_CONFLICT
        )


class UploadTooLargeError(MedLabException):
    def __init__(
        self,
        message: str = "Uploaded file exceeds maximum allowed size (25MB)",
        code: str = "UPLOAD_TOO_LARGE",
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )


class UnsupportedMediaTypeError(MedLabException):
    def __init__(
        self,
        message: str = "File format is not supported",
        code: str = "UNSUPPORTED_FILE_TYPE",
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        )


class RateLimitError(MedLabException):
    def __init__(
        self,
        message: str = "Rate limit exceeded. Please retry later.",
        code: str = "RATE_LIMIT_EXCEEDED",
    ):
        super().__init__(
            code=code, message=message, status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )


def get_request_id(request: Request) -> str:
    """Retrieve correlation request_id or generate one."""
    return getattr(request.state, "request_id", str(uuid.uuid4()))


def setup_exception_handlers(app: FastAPI) -> None:
    """Register uniform JSON error envelope handlers."""

    @app.exception_handler(MedLabException)
    async def medlab_exception_handler(
        request: Request, exc: MedLabException
    ) -> JSONResponse:
        req_id = get_request_id(request)
        content = {
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": [d.model_dump() for d in exc.details],
            },
            "requestId": req_id,
        }
        return JSONResponse(status_code=exc.status_code, content=content)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        req_id = get_request_id(request)
        details = []
        for err in exc.errors():
            loc = ".".join(str(x) for x in err.get("loc", []) if x != "body")
            details.append(
                {
                    "field": loc if loc else None,
                    "message": err.get("msg", "Validation error"),
                    "code": err.get("type", "value_error"),
                }
            )
        content = {
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed. Please check the provided fields.",
                "details": details,
            },
            "requestId": req_id,
        }
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=content
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        req_id = get_request_id(request)
        content = {
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected internal server error occurred. Please try again later.",
                "details": [],
            },
            "requestId": req_id,
        }
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=content
        )
