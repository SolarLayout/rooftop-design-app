"""The health check."""

from typing import Literal

from pydantic import BaseModel, Field


class Health(BaseModel):
    """Answer of the health check."""

    status: Literal["ok"]
    version: str
    commit: str | None = Field(
        description="The commit the server was built from; null when the build did not say."
    )
