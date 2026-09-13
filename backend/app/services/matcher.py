"""
SpartanMatch matching engine.

This is the heart of the application and the only file that contains the
scoring rules. It is deliberately written as plain Python:

  * no FastAPI
  * no SQLModel / no database session
  * no network calls, no machine learning, no randomness

Everything in here is a pure function over simple data structures, which is
why `tests/test_matcher.py` can test it without starting a server or creating
a database.

Scoring model (total 100 points)
-------------------------------
    Skills                60
    Interests             20
    Preferred role        10
    Learning opportunity  10

Two rules keep comparisons between members fair:

  1. Every denominator comes from the PROJECT, never from the member.
     A member who lists one interest that happens to match is not allowed to
     look better than a member who lists five and matches three.
  2. A required skill the member does not have counts as level 0. Missing
     skills are never skipped, otherwise an empty profile would score 60/60.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

# --------------------------------------------------------------------------
# Weights. Changing these four numbers changes the whole scoring model, so
# they live in one obvious place.
# --------------------------------------------------------------------------

SKILL_WEIGHT = 60.0
INTEREST_WEIGHT = 20.0
ROLE_WEIGHT = 10.0
GROWTH_WEIGHT = 10.0

MAX_SCORE = SKILL_WEIGHT + INTEREST_WEIGHT + ROLE_WEIGHT + GROWTH_WEIGHT  # 100.0

# A fully-met requirement is only worth calling out as a strength if the
# project actually asked for a meaningful level of it.
NOTABLE_SKILL_LEVEL = 3

# How many strengths of one kind we list, so explanations stay readable.
MAX_LISTED_STRENGTHS = 3


# --------------------------------------------------------------------------
# Input / output data structures
# --------------------------------------------------------------------------


@dataclass
class MemberProfile:
    """A club member, as far as the matcher is concerned."""

    id: int
    name: str
    major: str = ""
    skills: Dict[str, int] = field(default_factory=dict)
    interests: List[str] = field(default_factory=list)
    preferred_roles: List[str] = field(default_factory=list)
    learning_goals: List[str] = field(default_factory=list)


@dataclass
class ProjectProfile:
    """A club project, as far as the matcher is concerned."""

    id: int
    name: str
    description: str = ""
    required_skills: Dict[str, int] = field(default_factory=dict)
    topics: List[str] = field(default_factory=list)
    roles: List[str] = field(default_factory=list)
    technologies: List[str] = field(default_factory=list)


@dataclass
class SkillGap:
    """One required skill the member does not fully cover."""

    skill: str
    required_level: int
    member_level: int


@dataclass
class MatchResult:
    """The full, explainable outcome of scoring one member against one project."""

    total_score: float
    skill_score: float
    interest_score: float
    role_score: float
    growth_score: float
    matched_skills: List[str]
    weak_or_missing_skills: List[SkillGap]
    matched_interests: List[str]
    matched_learning_goals: List[str]
    reasons: List[str]
    weaknesses: List[str]


# --------------------------------------------------------------------------
# String handling
#
# We compare on a normalized form ("python") but always display the spelling
# the project used ("Python"), so the UI stays tidy even when members type
# their skills inconsistently.
# --------------------------------------------------------------------------


def normalize(value: str) -> str:
    """Return the comparison form of a skill / topic / role name."""
    return value.strip().lower()


def _normalized_set(values: Iterable[str]) -> set:
    """Normalized, de-duplicated set, ignoring blank entries."""
    return {normalize(v) for v in values if v and v.strip()}


def _join_names(names: Sequence[str]) -> str:
    """Human-readable list: 'A', 'A and B', 'A, B and C'."""
    names = list(names)
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    return f"{', '.join(names[:-1])} and {names[-1]}"


# --------------------------------------------------------------------------
# The four component scores
#
# Each one returns its points plus the evidence behind those points, so the
# UI never has to re-derive anything the matcher already worked out.
# --------------------------------------------------------------------------


def score_skills(
    member: MemberProfile, project: ProjectProfile
) -> Tuple[float, List[str], List[SkillGap]]:
    """
    Average how well the member covers each required skill, then scale to 60.

    For every skill the project requires:

        ratio = min(member_level / required_level, 1.0)

    A member who exceeds the requirement earns 1.0, not more, so being
    overqualified in one skill cannot hide a gap in another.
    """
    requirements = project.required_skills or {}
    if not requirements:
        # A project with no listed requirements cannot penalise anyone.
        return SKILL_WEIGHT, [], []

    # Normalized lookup of what the member can actually do.
    member_levels = {normalize(name): level for name, level in member.skills.items()}

    ratios: List[float] = []
    matched_skills: List[str] = []
    gaps: List[SkillGap] = []

    for skill_name, required_level in requirements.items():
        member_level = int(member_levels.get(normalize(skill_name), 0))

        if required_level <= 0:
            # Defensive: a requirement of 0 is not a requirement.
            ratios.append(1.0)
            continue

        ratio = min(member_level / required_level, 1.0)
        ratios.append(ratio)

        if ratio >= 1.0:
            matched_skills.append(skill_name)
        else:
            gaps.append(
                SkillGap(
                    skill=skill_name,
                    required_level=int(required_level),
                    member_level=member_level,
                )
            )

    average_ratio = sum(ratios) / len(ratios)
    return average_ratio * SKILL_WEIGHT, matched_skills, gaps


def score_interests(
    member: MemberProfile, project: ProjectProfile
) -> Tuple[float, List[str]]:
    """Share of the project's topics the member is interested in, scaled to 20."""
    if not project.topics:
        return INTEREST_WEIGHT, []

    member_interests = _normalized_set(member.interests)
    matched = [topic for topic in project.topics if normalize(topic) in member_interests]

    return (len(matched) / len(project.topics)) * INTEREST_WEIGHT, matched


def score_role(
    member: MemberProfile, project: ProjectProfile
) -> Tuple[float, Optional[str]]:
    """
    All-or-nothing: 10 points if any preferred role is one the project needs.

    Kept binary on purpose. A partial role score would be hard to explain and
    the club only cares whether someone can slot into an open role at all.
    """
    if not project.roles:
        return ROLE_WEIGHT, None

    member_roles = _normalized_set(member.preferred_roles)
    for role in project.roles:
        if normalize(role) in member_roles:
            return ROLE_WEIGHT, role

    return 0.0, None


def score_growth(
    member: MemberProfile, project: ProjectProfile
) -> Tuple[float, List[str]]:
    """
    Share of the project's technologies the member wants to learn, scaled to 10.

    This is what keeps the tool from only ever recommending people who already
    know everything: working on the project has to be worth their time too.
    """
    if not project.technologies:
        return GROWTH_WEIGHT, []

    goals = _normalized_set(member.learning_goals)
    matched = [tech for tech in project.technologies if normalize(tech) in goals]

    return (len(matched) / len(project.technologies)) * GROWTH_WEIGHT, matched


# --------------------------------------------------------------------------
# Explanations
#
# Written from the score evidence with plain string formatting. No LLM, no
# templates chosen at random: the same member and project always produce the
# same sentences, which is what makes the tool defensible to members who ask
# why they were not picked.
# --------------------------------------------------------------------------


def build_reasons(
    member: MemberProfile,
    project: ProjectProfile,
    matched_skills: List[str],
    gaps: List[SkillGap],
    matched_interests: List[str],
    matched_role: Optional[str],
    matched_goals: List[str],
) -> List[str]:
    """Positive, human-readable reasons this member fits the project."""
    reasons: List[str] = []
    member_levels = {normalize(name): level for name, level in member.skills.items()}

    # Strengths: requirements the member fully covers, hardest requirement first.
    notable = [
        skill
        for skill in matched_skills
        if project.required_skills.get(skill, 0) >= NOTABLE_SKILL_LEVEL
    ]
    notable.sort(key=lambda s: (-project.required_skills.get(s, 0), s))

    for skill in notable[:MAX_LISTED_STRENGTHS]:
        level = member_levels.get(normalize(skill), 0)
        reasons.append(f"Strong {skill} experience (level {level} of 5)")

    if matched_skills and not gaps:
        reasons.append("Meets every required skill level")

    if matched_interests:
        reasons.append(f"Interested in {_join_names(matched_interests)}")

    if matched_role:
        reasons.append(f"Preferred {matched_role} role is available")

    if matched_goals:
        reasons.append(f"Opportunity to learn {_join_names(matched_goals)}")

    if not reasons:
        reasons.append("No clear overlap with this project's requirements")

    return reasons


def build_weaknesses(
    gaps: List[SkillGap],
    matched_interests: List[str],
    matched_role: Optional[str],
    project: ProjectProfile,
) -> List[str]:
    """Honest, human-readable concerns about this member for this project."""
    weaknesses: List[str] = []

    # Biggest shortfall first so the most important gap is read first.
    for gap in sorted(gaps, key=lambda g: (g.member_level - g.required_level, g.skill)):
        if gap.member_level == 0:
            weaknesses.append(
                f"No {gap.skill} experience yet (project needs level {gap.required_level})"
            )
        else:
            weaknesses.append(
                f"{gap.skill} is below the desired level "
                f"({gap.member_level} of {gap.required_level})"
            )

    if project.topics and not matched_interests:
        weaknesses.append("None of their listed interests match this project's topics")

    if project.roles and matched_role is None:
        weaknesses.append("Their preferred roles are not among the roles this project needs")

    return weaknesses


# --------------------------------------------------------------------------
# Public entry points
# --------------------------------------------------------------------------


def calculate_match(member: MemberProfile, project: ProjectProfile) -> MatchResult:
    """
    Score one member against one project.

    Component scores are rounded to one decimal place and the total is the sum
    of those rounded components, so the breakdown shown in the UI always adds
    up to the headline percentage.
    """
    skill_score, matched_skills, gaps = score_skills(member, project)
    interest_score, matched_interests = score_interests(member, project)
    role_score, matched_role = score_role(member, project)
    growth_score, matched_goals = score_growth(member, project)

    skill_score = round(skill_score, 1)
    interest_score = round(interest_score, 1)
    role_score = round(role_score, 1)
    growth_score = round(growth_score, 1)
    total_score = round(skill_score + interest_score + role_score + growth_score, 1)

    return MatchResult(
        total_score=total_score,
        skill_score=skill_score,
        interest_score=interest_score,
        role_score=role_score,
        growth_score=growth_score,
        matched_skills=matched_skills,
        weak_or_missing_skills=gaps,
        matched_interests=matched_interests,
        matched_learning_goals=matched_goals,
        reasons=build_reasons(
            member,
            project,
            matched_skills,
            gaps,
            matched_interests,
            matched_role,
            matched_goals,
        ),
        weaknesses=build_weaknesses(gaps, matched_interests, matched_role, project),
    )


def rank_members_for_project(
    members: Sequence[MemberProfile], project: ProjectProfile
) -> List[Tuple[MemberProfile, MatchResult]]:
    """
    Score every member against one project, best first.

    Ties break alphabetically by name so the ranking is stable between
    requests instead of depending on database row order.
    """
    scored = [(member, calculate_match(member, project)) for member in members]
    scored.sort(key=lambda pair: (-pair[1].total_score, pair[0].name))
    return scored


def rank_projects_for_member(
    projects: Sequence[ProjectProfile], member: MemberProfile
) -> List[Tuple[ProjectProfile, MatchResult]]:
    """The same scoring in reverse: which projects suit one member best."""
    scored = [(project, calculate_match(member, project)) for project in projects]
    scored.sort(key=lambda pair: (-pair[1].total_score, pair[0].name))
    return scored
