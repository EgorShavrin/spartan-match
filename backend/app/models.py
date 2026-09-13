"""
Database tables.

Collection-like fields (skills, interests, roles, technologies, learning
goals) are stored as JSON columns rather than in separate join tables.

That is a deliberate MVP decision: nothing in this application ever queries
*inside* those collections through SQL. Every read loads a whole member or a
whole project anyway, because the matcher needs the complete profile. Five
join tables would buy query flexibility we do not use, at the cost of code
that is much harder to read.
"""

from typing import Dict, List, Optional

# Column and JSON come from SQLAlchemy, which SQLModel is built on. Declaring
# sa_column explicitly is how a SQLModel field becomes a real JSON column.
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class Member(SQLModel, table=True):
    """A club member and what they can do, care about, and want to learn."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    major: str = ""

    # Skill name -> level from 1 (beginner) to 5 (strong).
    skills: Dict[str, int] = Field(default_factory=dict, sa_column=Column(JSON))
    interests: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    preferred_roles: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    learning_goals: List[str] = Field(default_factory=list, sa_column=Column(JSON))


class Project(SQLModel, table=True):
    """A club project and what it needs from the people who join it."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str = ""

    # Skill name -> minimum level the project would like someone to have.
    required_skills: Dict[str, int] = Field(default_factory=dict, sa_column=Column(JSON))
    topics: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    roles: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    technologies: List[str] = Field(default_factory=list, sa_column=Column(JSON))
