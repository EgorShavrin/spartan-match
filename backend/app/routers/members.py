"""
Member endpoints.

    GET  /members       list every member
    GET  /members/{id}  one member
    POST /members       create a member

This router contains no scoring logic. It reads and writes rows, and that is
all it does.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import Member
from ..schemas import MemberCreate, MemberRead

router = APIRouter(prefix="/members", tags=["members"])


@router.get("", response_model=List[MemberRead])
def list_members(session: Session = Depends(get_session)):
    """Every member, ordered by name so the page looks the same on each load."""
    return session.exec(select(Member).order_by(Member.name)).all()


@router.get("/{member_id}", response_model=MemberRead)
def get_member(member_id: int, session: Session = Depends(get_session)):
    member = session.get(Member, member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


@router.post("", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
def create_member(payload: MemberCreate, session: Session = Depends(get_session)):
    """
    Create a member.

    FastAPI has already validated the JSON body against MemberCreate by the
    time this function runs, so a bad skill level never reaches the database.
    """
    member = Member(**payload.model_dump())
    session.add(member)
    session.commit()
    session.refresh(member)  # reload the row so `member.id` is populated
    return member
