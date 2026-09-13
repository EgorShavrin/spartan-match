"""
Matching endpoints.

    GET /projects/{id}/matches   rank all members for one project  <- the main one
    GET /members/{id}/matches    rank all projects for one member

This router is the bridge between the database and the matcher. It does three
things and nothing else:

  1. load rows from SQLite
  2. convert those rows into the plain dataclasses the matcher understands
  3. hand the matcher's output back to FastAPI as JSON

The scoring rules themselves live entirely in services/matcher.py. That
separation is why the matcher can be unit tested with no database.
"""

from dataclasses import asdict
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import Member, Project
from ..schemas import MemberMatch, ProjectMatch
from ..services.matcher import (
    MemberProfile,
    ProjectProfile,
    rank_members_for_project,
    rank_projects_for_member,
)

router = APIRouter(tags=["matches"])


# --------------------------------------------------------------------------
# Row -> dataclass conversion.
#
# These two small functions are the only place the database model and the
# matcher meet. The matcher never imports SQLModel.
# --------------------------------------------------------------------------


def to_member_profile(member: Member) -> MemberProfile:
    return MemberProfile(
        id=member.id,
        name=member.name,
        major=member.major,
        skills=dict(member.skills or {}),
        interests=list(member.interests or []),
        preferred_roles=list(member.preferred_roles or []),
        learning_goals=list(member.learning_goals or []),
    )


def to_project_profile(project: Project) -> ProjectProfile:
    return ProjectProfile(
        id=project.id,
        name=project.name,
        description=project.description,
        required_skills=dict(project.required_skills or {}),
        topics=list(project.topics or []),
        roles=list(project.roles or []),
        technologies=list(project.technologies or []),
    )


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------


@router.get("/projects/{project_id}/matches", response_model=List[MemberMatch])
def get_project_matches(project_id: int, session: Session = Depends(get_session)):
    """
    Rank every member against one project, best fit first.

    Steps, in order:
      1. load the project (404 if it does not exist)
      2. load every member
      3. convert both to matcher dataclasses
      4. let the matcher score and sort them
      5. attach a 1-based rank and return
    """
    project = session.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    members = session.exec(select(Member)).all()
    project_profile = to_project_profile(project)
    member_profiles = [to_member_profile(member) for member in members]

    ranked = rank_members_for_project(member_profiles, project_profile)

    # asdict() turns the matcher's dataclasses into plain dictionaries, which
    # is all Pydantic needs to build the response models.
    return [
        MemberMatch(rank=index, member=asdict(member), scores=asdict(result))
        for index, (member, result) in enumerate(ranked, start=1)
    ]


@router.get("/members/{member_id}/matches", response_model=List[ProjectMatch])
def get_member_matches(member_id: int, session: Session = Depends(get_session)):
    """The reverse view: which projects suit one member best."""
    member = session.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    projects = session.exec(select(Project)).all()
    member_profile = to_member_profile(member)
    project_profiles = [to_project_profile(project) for project in projects]

    ranked = rank_projects_for_member(project_profiles, member_profile)

    return [
        ProjectMatch(rank=index, project=asdict(project), scores=asdict(result))
        for index, (project, result) in enumerate(ranked, start=1)
    ]
