"""Tests for the AnalysisStore interface."""
import pytest

from datetime import datetime
from pathlib import Path
from typing import List, NamedTuple

from sqlalchemy.engine import Engine as SQLEngine

from opentrons.types import MountType, DeckSlotName
from opentrons.protocol_engine import (
    commands as pe_commands,
    errors as pe_errors,
    types as pe_types,
)
from opentrons.protocol_reader import (
    ProtocolSource,
    JsonProtocolConfig,
)

from robot_server.protocols.analysis_models import (
    AnalysisResult,
    AnalysisStatus,
    AnalysisSummary,
    PendingAnalysis,
    CompletedAnalysis,
)
from robot_server.protocols.analysis_store import (
    AnalysisStore,
    AnalysisNotFoundError,
)
from robot_server.protocols.protocol_store import (
    ProtocolStore,
    ProtocolResource,
)


@pytest.fixture
def protocol_store(sql_engine: SQLEngine) -> ProtocolStore:
    """Return a `ProtocolStore` linked to the same database as the subject under test.

    `ProtocolStore` is tested elsewhere.
    We only need it here to prepare the database for our `AnalysisStore` tests.
    An analysis always needs a protocol to link to.
    """
    return ProtocolStore.create_empty(sql_engine=sql_engine)


@pytest.fixture
def subject(sql_engine: SQLEngine) -> AnalysisStore:
    """Return the `AnalysisStore` test subject."""
    return AnalysisStore(sql_engine=sql_engine)


def make_dummy_protocol_resource(protocol_id: str) -> ProtocolResource:
    """Return a placeholder `ProtocolResource` to insert into a `ProtocolStore`.

    Args:
        protocol_id: The ID to give to the new `ProtocolResource`.
    """
    return ProtocolResource(
        protocol_id=protocol_id,
        created_at=datetime(year=2021, month=1, day=1),
        source=ProtocolSource(
            directory=Path("/dev/null"),
            main_file=Path("/dev/null"),
            config=JsonProtocolConfig(schema_version=123),
            files=[],
            metadata={},
            labware_definitions=[],
        ),
        protocol_key=None,
    )


async def test_get_empty(subject: AnalysisStore, protocol_store: ProtocolStore) -> None:
    """It should return an empty list if no analysis saved."""
    protocol_store.insert(make_dummy_protocol_resource("protocol-id"))

    full_result = await subject.get_by_protocol("protocol-id")
    summaries_result = subject.get_summaries_by_protocol("protocol-id")

    assert full_result == []
    assert summaries_result == []

    with pytest.raises(AnalysisNotFoundError, match="analysis-id"):
        await subject.get("analysis-id")


async def test_add_pending(
    subject: AnalysisStore, protocol_store: ProtocolStore
) -> None:
    """It should add a pending analysis to the store."""
    protocol_store.insert(make_dummy_protocol_resource(protocol_id="protocol-id"))

    expected_analysis = PendingAnalysis(id="analysis-id")
    expected_summary = AnalysisSummary(
        id="analysis-id",
        status=AnalysisStatus.PENDING,
    )

    result = subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")

    assert result == expected_summary
    assert await subject.get("analysis-id") == expected_analysis
    assert await subject.get_by_protocol("protocol-id") == [expected_analysis]
    assert subject.get_summaries_by_protocol("protocol-id") == [expected_summary]


async def test_returned_in_order_added(
    subject: AnalysisStore, protocol_store: ProtocolStore
) -> None:
    """It should return analyses from least-recently-added to most-recently-added."""
    protocol_store.insert(make_dummy_protocol_resource(protocol_id="protocol-id"))

    subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id-1")
    await subject.update(
        analysis_id="analysis-id-1",
        labware=[],
        pipettes=[],
        commands=[],
        errors=[],
    )

    subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id-2")
    await subject.update(
        analysis_id="analysis-id-2",
        labware=[],
        pipettes=[],
        commands=[],
        errors=[],
    )

    subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id-3")
    await subject.update(
        analysis_id="analysis-id-3",
        labware=[],
        pipettes=[],
        commands=[],
        errors=[],
    )

    subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id-4")
    # Leave as pending, to test that we interleave completed & pending analyses
    # in the correct order.

    expected_order = [
        "analysis-id-1",
        "analysis-id-2",
        "analysis-id-3",
        "analysis-id-4",
    ]
    summaries = subject.get_summaries_by_protocol(protocol_id="protocol-id")
    full_analyses = await subject.get_by_protocol(protocol_id="protocol-id")
    assert [s.id for s in summaries] == expected_order
    assert [a.id for a in full_analyses] == expected_order


async def test_add_analysis_equipment(
    subject: AnalysisStore, protocol_store: ProtocolStore
) -> None:
    """It should add labware and pipettes to the stored analysis."""
    protocol_store.insert(make_dummy_protocol_resource(protocol_id="protocol-id"))

    labware = pe_types.LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="namespace/load-name/42",
        location=pe_types.DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        offsetId=None,
    )

    pipette = pe_types.LoadedPipette(
        id="pipette-id",
        pipetteName=pe_types.PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )

    subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")
    await subject.update(
        analysis_id="analysis-id",
        labware=[labware],
        pipettes=[pipette],
        commands=[],
        errors=[],
    )

    result = await subject.get("analysis-id")

    assert result == CompletedAnalysis(
        id="analysis-id",
        result=AnalysisResult.OK,
        labware=[labware],
        pipettes=[pipette],
        commands=[],
        errors=[],
    )
    assert await subject.get_by_protocol("protocol-id") == [result]


class AnalysisResultSpec(NamedTuple):
    """Spec data for analysis result tests."""

    commands: List[pe_commands.Command]
    errors: List[pe_errors.ErrorOccurrence]
    expected_result: AnalysisResult


analysis_result_specs: List[AnalysisResultSpec] = [
    AnalysisResultSpec(
        commands=[
            pe_commands.Pause(
                id="pause-1",
                key="command-key",
                status=pe_commands.CommandStatus.SUCCEEDED,
                createdAt=datetime(year=2021, month=1, day=1),
                params=pe_commands.PauseParams(message="hello world"),
                result=pe_commands.PauseResult(),
            )
        ],
        errors=[],
        expected_result=AnalysisResult.OK,
    ),
    AnalysisResultSpec(
        commands=[],
        errors=[
            pe_errors.ErrorOccurrence(
                id="error-id",
                createdAt=datetime(year=2021, month=1, day=1),
                errorType="BadError",
                detail="oh no",
            )
        ],
        expected_result=AnalysisResult.NOT_OK,
    ),
]


@pytest.mark.parametrize(AnalysisResultSpec._fields, analysis_result_specs)
async def test_update_infers_status_from_errors(
    subject: AnalysisStore,
    protocol_store: ProtocolStore,
    commands: List[pe_commands.Command],
    errors: List[pe_errors.ErrorOccurrence],
    expected_result: AnalysisResult,
) -> None:
    """It should decide the analysis result based on whether there are errors."""
    protocol_store.insert(make_dummy_protocol_resource(protocol_id="protocol-id"))
    subject.add_pending(protocol_id="protocol-id", analysis_id="analysis-id")
    await subject.update(
        analysis_id="analysis-id",
        commands=commands,
        errors=errors,
        labware=[],
        pipettes=[],
    )
    analysis = (await subject.get_by_protocol("protocol-id"))[0]
    assert isinstance(analysis, CompletedAnalysis)
    assert analysis.result == expected_result
