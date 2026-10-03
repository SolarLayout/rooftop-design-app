"""The pages of the report as images, for the preview on the screen (the PDF is the same drawing)."""

from datetime import date

from pydantic import BaseModel, Field


class ReportPage(BaseModel):
    """One page of the report, drawn as the PDF prints it."""

    number: int = Field(description="The page's place in the PDF, from 1")
    title: str = Field(
        description="A short title for the page: Summary, Layout, Shadows, Energy, Schedule, "
        "Schedule (continued), SLD"
    )
    width: int = Field(description="Of the PNG, in pixels")
    height: int = Field(description="Of the PNG, in pixels")
    png: str = Field(description="The page as a PNG, base64")


class ReportPages(BaseModel):
    """Every page of the report, in order, as the PDF of the same day would print them."""

    day: date = Field(description="The day printed on page 1: the one asked for, or the server's today")
    dpi: int = Field(description="The resolution of the pages; A4 landscape at 150 dpi is 1753 × 1240")
    pages: list[ReportPage]
