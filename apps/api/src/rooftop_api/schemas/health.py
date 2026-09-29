"""The health check."""

from typing import Literal

from pydantic import BaseModel


class Health(BaseModel):
    """Answer of the health check."""

    status: Literal["ok"]
    version: str
