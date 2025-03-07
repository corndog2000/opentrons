"""Protocol file models."""
from datetime import datetime
from pydantic import BaseModel, Extra, Field
from typing import Any, List, Optional

from opentrons.protocol_reader import (
    ProtocolType as ProtocolType,
    ProtocolFileRole as ProtocolFileRole,
)

from robot_server.service.json_api import ResourceModel
from .analysis_models import AnalysisSummary


class ProtocolFile(BaseModel):
    """A file in a protocol."""

    # TODO(mc, 2021-11-12): add unique ID to file resource
    name: str = Field(..., description="The file's basename, including extension")
    role: ProtocolFileRole = Field(..., description="The file's role in the protocol.")


class Metadata(BaseModel):
    """Extra, nonessential information about the protocol.

    This can include data like:

    * A human-readable title and description.
    * A last-modified date.
    * A list of authors.

    Metadata may contain fields other than those explicitly
    listed in this schema.

    The metadata *should not* include information needed
    to run the protocol correctly. For historical reasons, Python
    protocols define their `apiLevel` inside their metadata, but
    this should be considered an exception to the rule.
    """

    # todo(mm, 2021-09-17): Revise these docs after specifying
    # metadata more. github.com/Opentrons/opentrons/issues/8334

    class Config:
        """Tell Pydantic that metadata objects can have arbitrary fields."""

        extra = Extra.allow


class Protocol(ResourceModel):
    """A model representing an uploaded protocol resource."""

    id: str = Field(..., description="A unique identifier for this protocol.")

    createdAt: datetime = Field(
        ...,
        description=(
            "When this protocol was *uploaded.*"
            " (`metadata` may have information about"
            " when this protocol was *authored.*)"
        ),
    )

    files: List[ProtocolFile]

    protocolType: ProtocolType = Field(
        ...,
        description="The type of protocol file (JSON or Python).",
    )

    # todo(mm, 2021-09-16): Investigate whether something like `dict[str, Any]` would
    # be a better way (e.g. produce better OpenAPI) to represent an arbitrary JSON obj.
    metadata: Metadata

    analyses: List[Any] = Field(
        default_factory=list,
        description=(
            "This field was deprecated for performance reasons."
            " It will always be returned as an empty list."
            " Use `analysisSummaries` and `GET /protocols/:id/analyses` instead."
        ),
    )

    analysisSummaries: List[AnalysisSummary] = Field(
        ...,
        description=(
            "Summaries of any analyses run to check how this protocol"
            " is expected to run. For more detailed information,"
            " use `GET /protocols/:id/analyses`."
            "\n\n"
            "Returned in order from the least-recently started analysis"
            " to the most-recently started analysis."
        ),
    )

    key: Optional[str] = None
