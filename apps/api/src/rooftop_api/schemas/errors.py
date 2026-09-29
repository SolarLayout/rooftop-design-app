"""The one shape of every error the API answers with."""

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """What went wrong, in words for the user, and where."""

    code: str
    message: str
    field: str | None = None


class ErrorResponse(BaseModel):
    """The body of every answer that is not a success."""

    error: ErrorDetail
