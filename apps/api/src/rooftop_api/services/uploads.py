"""Files that arrive in a request: their name and their bytes."""

import base64
import binascii

from rooftop_api.errors import UNPROCESSABLE, ApiError
from rooftop_core.paths import file_name

__all__ = ["bytes_of", "file_name"]


def bytes_of(content: str, name: str, field: str = "base64") -> bytes:
    """The bytes of a file sent as base64. *name* and *field* say which file and where, when it is none."""
    try:
        return base64.b64decode(content, validate=True)
    except (binascii.Error, ValueError) as error:
        raise ApiError(
            UNPROCESSABLE, "invalid_base64", f"The content of {name} is not valid base64.", field
        ) from error
