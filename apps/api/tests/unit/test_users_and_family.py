"""Unit tests for Users and Family Pydantic schemas and Services."""

import uuid
from datetime import UTC, date, datetime
from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError

from app.db.models import FamilyMember, UserProfile
from app.modules.family import service as family_service
from app.modules.family.schemas import (
    FamilyMemberCreateRequest,
    FamilyMemberUpdateRequest,
    WorkspaceUpdateRequest,
)
from app.modules.users import service as user_service
from app.modules.users.schemas import (
    UserProfileUpdateRequest,
)


def test_family_member_create_schema() -> None:
    """Verify validation of FamilyMemberCreateRequest."""
    req = FamilyMemberCreateRequest(
        fullName="Leo Jenkins",
        relationship="Child",
        dateOfBirth=date(2020, 5, 12),
        notes="Asthma history",
    )
    assert req.fullName == "Leo Jenkins"
    assert req.relationship == "child"
    assert req.dateOfBirth == date(2020, 5, 12)

    # Empty full name should fail validation
    with pytest.raises(ValidationError):
        FamilyMemberCreateRequest(fullName="   ", relationship="child")


def test_family_member_update_schema() -> None:
    """Verify validation of FamilyMemberUpdateRequest."""
    req = FamilyMemberUpdateRequest(fullName="Leo Updated")
    assert req.fullName == "Leo Updated"
    assert req.relationship is None

    # Empty full name should fail validation
    with pytest.raises(ValidationError):
        FamilyMemberUpdateRequest(fullName="")


def test_user_profile_update_schema() -> None:
    """Verify UserProfileUpdateRequest schema."""
    req = UserProfileUpdateRequest(displayName="Sarah Jenkins")
    assert req.displayName == "Sarah Jenkins"

    # Too long display name should fail
    with pytest.raises(ValidationError):
        UserProfileUpdateRequest(displayName="x" * 150)


def test_workspace_update_schema() -> None:
    """Verify WorkspaceUpdateRequest schema."""
    req = WorkspaceUpdateRequest(name="The Jenkins Vault")
    assert req.name == "The Jenkins Vault"

    with pytest.raises(ValidationError):
        WorkspaceUpdateRequest(name=" ")


def test_user_service_get_or_create_profile() -> None:
    """Verify UserService retrieves or creates user profile."""
    mock_db = MagicMock()
    user_id = uuid.uuid4()
    now = datetime.now(UTC)

    existing_profile = UserProfile(
        user_id=user_id,
        display_name="Alex",
        created_at=now,
        updated_at=now,
    )
    mock_db.scalar.return_value = existing_profile

    profile = user_service.get_or_create_profile(mock_db, user_id=user_id)
    assert profile.id == user_id
    assert profile.displayName == "Alex"


def test_family_service_get_workspace() -> None:
    """Verify family service creates workspace if not existing."""
    mock_db = MagicMock()
    user_id = uuid.uuid4()
    mock_db.scalar.return_value = None

    workspace = family_service.get_workspace(mock_db, owner_user_id=user_id)
    assert workspace.name == "My Family"
    mock_db.add.assert_called_once()
    mock_db.flush.assert_called_once()


def test_family_service_create_member() -> None:
    """Verify family service creates member in workspace."""
    mock_db = MagicMock()
    workspace_id = uuid.uuid4()

    req = FamilyMemberCreateRequest(
        fullName="Emma Jenkins",
        relationship="child",
        dateOfBirth=date(2022, 1, 1),
    )

    member = family_service.create_family_member(
        mock_db, workspace_id=workspace_id, create_data=req
    )
    assert member.fullName == "Emma Jenkins"
    assert member.relationship == "child"
    mock_db.add.assert_called_once()
    mock_db.flush.assert_called_once()


def test_family_service_soft_delete_member() -> None:
    """Verify soft-delete marks deleted_at timestamp and revokes share links."""
    mock_db = MagicMock()
    workspace_id = uuid.uuid4()
    member_id = uuid.uuid4()
    now = datetime.now(UTC)

    member = FamilyMember(
        id=member_id,
        workspace_id=workspace_id,
        display_name="Emma Jenkins",
        relationship_label="Daughter",
        created_at=now,
        updated_at=now,
    )
    mock_db.scalar.return_value = member

    family_service.soft_delete_family_member(
        mock_db, workspace_id=workspace_id, member_id=member_id
    )
    assert member.deleted_at is not None
    assert mock_db.execute.call_count == 2
    mock_db.flush.assert_called_once()
