"""
Request and response shapes for the API.

The models in `models.py` describe how data is *stored*. The models here
describe how data is *sent over HTTP*. Keeping them separate means the client
cannot, for example, post its own `id`, and the match responses can have a
shape that has nothing to do with any table.

These classes are also what generates the interactive docs at /docs.
"""

from typing import Dict, List

from pydantic import BaseModel, Field, field_validator

MIN_SKILL_LEVEL = 1
MAX_SKILL_LEVEL = 5


def _clean_list(values: List[str]) -> List[str]:
    """Drop blanks and duplicates while keeping the order the user chose."""
    seen = set()
    cleaned = []
    for value in values:
        value = value.strip()
        if not value or value.lower() in seen:
            continue
        seen.add(value.lower())
        cleaned.append(value)
    return cleaned


class _SkillLevelValidation(BaseModel):
    """Shared validation for the skill dictionaries on both create schemas."""

    @field_validator("skills", "required_skills", check_fields=False)
    @classmethod
    def check_skill_levels(cls, skills: Dict[str, int]) -> Dict[str, int]:
        cleaned: Dict[str, int] = {}
        for name, level in skills.items():
            name = name.strip()
            if not name:
                continue
            if not MIN_SKILL_LEVEL <= level <= MAX_SKILL_LEVEL:
                raise ValueError(
                    f"Skill level for {name!r} must be between "
                    f"{MIN_SKILL_LEVEL} and {MAX_SKILL_LEVEL}"
                )
            cleaned[name] = level
        return cleaned

    @field_validator("interests", "preferred_roles", "learning_goals",
                     "topics", "roles", "technologies", check_fields=False)
    @classmethod
    def tidy_lists(cls, values: List[str]) -> List[str]:
        return _clean_list(values)


# --------------------------------------------------------------------------
# Members
# --------------------------------------------------------------------------


class MemberCreate(_SkillLevelValidation):
    name: str = Field(min_length=1, max_length=120)
    major: str = Field(default="", max_length=120)
    skills: Dict[str, int] = Field(default_factory=dict)
    interests: List[str] = Field(default_factory=list)
    preferred_roles: List[str] = Field(default_factory=list)
    learning_goals: List[str] = Field(default_factory=list)


class MemberRead(BaseModel):
    id: int
    name: str
    major: str
    skills: Dict[str, int]
    interests: List[str]
    preferred_roles: List[str]
    learning_goals: List[str]

    # Lets FastAPI build this straight from a SQLModel row.
    model_config = {"from_attributes": True}


# --------------------------------------------------------------------------
# Projects
# --------------------------------------------------------------------------


class ProjectCreate(_SkillLevelValidation):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=1000)
    required_skills: Dict[str, int] = Field(default_factory=dict)
    topics: List[str] = Field(default_factory=list)
    roles: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)


class ProjectRead(BaseModel):
    id: int
    name: str
    description: str
    required_skills: Dict[str, int]
    topics: List[str]
    roles: List[str]
    technologies: List[str]

    model_config = {"from_attributes": True}


# --------------------------------------------------------------------------
# Match results
# --------------------------------------------------------------------------


class SkillGapRead(BaseModel):
    skill: str
    required_level: int
    member_level: int

    model_config = {"from_attributes": True}


class MatchScores(BaseModel):
    """One member scored against one project, with the evidence behind it."""

    total_score: float
    skill_score: float
    interest_score: float
    role_score: float
    growth_score: float
    matched_skills: List[str]
    weak_or_missing_skills: List[SkillGapRead]
    matched_interests: List[str]
    matched_learning_goals: List[str]
    reasons: List[str]
    weaknesses: List[str]

    # Built directly from the matcher's MatchResult dataclass.
    model_config = {"from_attributes": True}


class MemberMatch(BaseModel):
    """A ranked member, returned by GET /projects/{id}/matches."""

    rank: int
    member: MemberRead
    scores: MatchScores

    model_config = {"from_attributes": True}


class ProjectMatch(BaseModel):
    """A ranked project, returned by GET /members/{id}/matches."""

    rank: int
    project: ProjectRead
    scores: MatchScores

    model_config = {"from_attributes": True}
