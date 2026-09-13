"""
Unit tests for the matching engine.

These tests import `app.services.matcher` directly. No database is created, no
server is started, and no HTTP request is made. That is only possible because
the matcher is pure Python over plain dataclasses.

Run with:   cd backend && pytest
"""

import pytest

from app.services.matcher import (
    GROWTH_WEIGHT,
    INTEREST_WEIGHT,
    MAX_SCORE,
    ROLE_WEIGHT,
    SKILL_WEIGHT,
    MemberProfile,
    ProjectProfile,
    calculate_match,
    rank_members_for_project,
    rank_projects_for_member,
)


# --------------------------------------------------------------------------
# Test fixtures: one project, reused across most tests.
# --------------------------------------------------------------------------


@pytest.fixture
def project() -> ProjectProfile:
    """The worked example from the project brief."""
    return ProjectProfile(
        id=1,
        name="AI Study Planner",
        required_skills={"Python": 4, "React": 3, "SQL": 2},
        topics=["AI", "Education", "Backend"],
        roles=["Backend Developer", "Frontend Developer"],
        technologies=["Python", "FastAPI", "Next.js"],
    )


def make_member(**overrides) -> MemberProfile:
    """A member with everything empty, so each test sets only what it cares about."""
    defaults = dict(
        id=1,
        name="Test Member",
        major="Computer Science",
        skills={},
        interests=[],
        preferred_roles=[],
        learning_goals=[],
    )
    defaults.update(overrides)
    return MemberProfile(**defaults)


# --------------------------------------------------------------------------
# 1. Perfect match
# --------------------------------------------------------------------------


def test_perfect_match_scores_100(project):
    member = make_member(
        name="Perfect Pat",
        skills={"Python": 5, "React": 5, "SQL": 5},
        interests=["AI", "Education", "Backend"],
        preferred_roles=["Backend Developer"],
        learning_goals=["Python", "FastAPI", "Next.js"],
    )

    result = calculate_match(member, project)

    assert result.skill_score == SKILL_WEIGHT
    assert result.interest_score == INTEREST_WEIGHT
    assert result.role_score == ROLE_WEIGHT
    assert result.growth_score == GROWTH_WEIGHT
    assert result.total_score == 100.0
    assert result.weak_or_missing_skills == []
    assert result.weaknesses == []


# --------------------------------------------------------------------------
# 2. Zero / very weak match
# --------------------------------------------------------------------------


def test_empty_profile_scores_zero(project):
    """An empty profile must score 0, not 60. Missing skills count as level 0."""
    member = make_member(name="Empty Emma")

    result = calculate_match(member, project)

    assert result.total_score == 0.0
    assert result.skill_score == 0.0
    assert len(result.weak_or_missing_skills) == 3
    assert result.reasons == ["No clear overlap with this project's requirements"]


def test_weak_match_is_low_but_not_zero(project):
    member = make_member(
        name="Weak Wally",
        skills={"SQL": 1},  # 0 + 0 + 0.5 over three skills
        interests=["Robotics"],
        preferred_roles=["Hardware Engineer"],
        learning_goals=["Rust"],
    )

    result = calculate_match(member, project)

    assert result.skill_score == pytest.approx(10.0, abs=0.05)  # (0.5/3) * 60
    assert result.interest_score == 0.0
    assert result.role_score == 0.0
    assert result.growth_score == 0.0
    assert 0 < result.total_score < 15


# --------------------------------------------------------------------------
# 3. Missing required skills
# --------------------------------------------------------------------------


def test_missing_skill_is_reported_as_a_gap(project):
    member = make_member(skills={"Python": 4, "SQL": 2})  # no React at all

    result = calculate_match(member, project)

    gaps = {gap.skill: gap for gap in result.weak_or_missing_skills}
    assert set(gaps) == {"React"}
    assert gaps["React"].member_level == 0
    assert gaps["React"].required_level == 3
    assert "No React experience yet (project needs level 3)" in result.weaknesses


def test_missing_skills_are_never_skipped(project):
    """Two of three skills perfect, one absent -> two thirds of the skill points."""
    member = make_member(skills={"Python": 4, "SQL": 2})

    result = calculate_match(member, project)

    assert result.skill_score == pytest.approx(40.0, abs=0.05)  # (2/3) * 60


# --------------------------------------------------------------------------
# 4. Correct skill ratios
# --------------------------------------------------------------------------


def test_skill_ratios_match_the_worked_example(project):
    """
    From the brief: Python 4/4, React 2/3, SQL 2/2 -> average 0.889 -> ~53/60.
    """
    member = make_member(skills={"Python": 4, "React": 2, "SQL": 2})

    result = calculate_match(member, project)

    assert result.skill_score == pytest.approx(53.3, abs=0.05)
    assert sorted(result.matched_skills) == ["Python", "SQL"]
    assert [gap.skill for gap in result.weak_or_missing_skills] == ["React"]
    assert "React is below the desired level (2 of 3)" in result.weaknesses


def test_exceeding_a_requirement_is_capped_at_full_credit(project):
    """Being overqualified in one skill must not compensate for a gap elsewhere."""
    modest = make_member(skills={"Python": 4, "React": 3, "SQL": 2})
    overqualified = make_member(skills={"Python": 5, "React": 5, "SQL": 5})

    assert calculate_match(modest, project).skill_score == SKILL_WEIGHT
    assert calculate_match(overqualified, project).skill_score == SKILL_WEIGHT


def test_project_with_no_required_skills_gives_full_skill_credit():
    project = ProjectProfile(id=9, name="Open Project", topics=["AI"])
    member = make_member(skills={})

    result = calculate_match(member, project)

    assert result.skill_score == SKILL_WEIGHT


# --------------------------------------------------------------------------
# 5. Interest overlap
# --------------------------------------------------------------------------


def test_interest_score_uses_the_project_as_the_denominator(project):
    """Two of the project's three topics match -> 2/3 of 20 points."""
    member = make_member(interests=["AI", "Backend", "FinTech", "Robotics", "Games"])

    result = calculate_match(member, project)

    assert result.interest_score == pytest.approx(13.3, abs=0.05)
    assert result.matched_interests == ["AI", "Backend"]
    assert "Interested in AI and Backend" in result.reasons


def test_long_interest_list_does_not_inflate_the_score(project):
    """
    A member listing one matching interest must not beat a member listing five
    interests of which three match. This is why the denominator is the project.
    """
    narrow = make_member(name="Narrow", interests=["AI"])
    broad = make_member(name="Broad", interests=["AI", "Education", "Backend", "Games", "Rust"])

    assert calculate_match(narrow, project).interest_score < calculate_match(
        broad, project
    ).interest_score


# --------------------------------------------------------------------------
# 6. Role overlap
# --------------------------------------------------------------------------


def test_one_matching_role_earns_all_role_points(project):
    member = make_member(preferred_roles=["Frontend Developer"])

    result = calculate_match(member, project)

    assert result.role_score == ROLE_WEIGHT
    assert "Preferred Frontend Developer role is available" in result.reasons


def test_no_matching_role_earns_no_role_points(project):
    member = make_member(preferred_roles=["Project Manager"])

    result = calculate_match(member, project)

    assert result.role_score == 0.0
    assert (
        "Their preferred roles are not among the roles this project needs"
        in result.weaknesses
    )


# --------------------------------------------------------------------------
# 7. Learning-goal overlap
# --------------------------------------------------------------------------


def test_growth_score_uses_project_technologies_as_the_denominator(project):
    """Wants to learn Next.js and FastAPI, project uses three techs -> 2/3 of 10."""
    member = make_member(learning_goals=["Next.js", "FastAPI", "Kubernetes"])

    result = calculate_match(member, project)

    assert result.growth_score == pytest.approx(6.7, abs=0.05)
    assert result.matched_learning_goals == ["FastAPI", "Next.js"]
    assert "Opportunity to learn FastAPI and Next.js" in result.reasons


# --------------------------------------------------------------------------
# 8. Case-insensitive matching
# --------------------------------------------------------------------------


def test_comparison_ignores_case_and_surrounding_whitespace(project):
    messy = make_member(
        name="Messy Typist",
        skills={"python": 4, "  REACT  ": 3, "sql": 2},
        interests=["ai", "EDUCATION", " backend "],
        preferred_roles=["backend developer"],
        learning_goals=["next.js", "FASTAPI", "python"],
    )

    result = calculate_match(messy, project)

    assert result.total_score == 100.0


def test_display_text_uses_the_projects_spelling(project):
    """The member typed 'ai'; the UI should still read 'AI'."""
    member = make_member(skills={"python": 4}, interests=["ai"])

    result = calculate_match(member, project)

    assert result.matched_skills == ["Python"]
    assert result.matched_interests == ["AI"]


# --------------------------------------------------------------------------
# 9. Ranking multiple members
# --------------------------------------------------------------------------


def test_members_are_ranked_best_first(project):
    strong = make_member(
        id=1,
        name="Strong Sam",
        skills={"Python": 5, "React": 4, "SQL": 3},
        interests=["AI", "Education", "Backend"],
        preferred_roles=["Backend Developer"],
        learning_goals=["Next.js", "FastAPI"],
    )
    middling = make_member(
        id=2,
        name="Middling Mo",
        skills={"Python": 4, "React": 2, "SQL": 2},
        interests=["AI"],
        preferred_roles=["Backend Developer"],
    )
    poor = make_member(id=3, name="Poor Pip", skills={"Java": 5}, interests=["Robotics"])

    ranked = rank_members_for_project([poor, strong, middling], project)

    assert [member.name for member, _ in ranked] == [
        "Strong Sam",
        "Middling Mo",
        "Poor Pip",
    ]
    scores = [result.total_score for _, result in ranked]
    assert scores == sorted(scores, reverse=True)


def test_ties_break_alphabetically_for_a_stable_order(project):
    """Ranking must not depend on database row order."""
    zoe = make_member(id=1, name="Zoe Adams", skills={"Python": 4, "React": 3, "SQL": 2})
    adam = make_member(id=2, name="Adam Zale", skills={"Python": 4, "React": 3, "SQL": 2})

    first_pass = rank_members_for_project([zoe, adam], project)
    second_pass = rank_members_for_project([adam, zoe], project)

    assert [m.name for m, _ in first_pass] == ["Adam Zale", "Zoe Adams"]
    assert [m.name for m, _ in first_pass] == [m.name for m, _ in second_pass]


def test_ranking_projects_for_a_member_also_works():
    """The reverse endpoint uses the same scoring rules."""
    member = make_member(
        name="Backend Bailey",
        skills={"Python": 5, "SQL": 4},
        interests=["Backend", "AI"],
        preferred_roles=["Backend Developer"],
    )
    backend_project = ProjectProfile(
        id=1,
        name="Backend Project",
        required_skills={"Python": 4, "SQL": 3},
        topics=["Backend", "AI"],
        roles=["Backend Developer"],
        technologies=["Python"],
    )
    design_project = ProjectProfile(
        id=2,
        name="Design Project",
        required_skills={"Figma": 5, "CSS": 4},
        topics=["UI/UX"],
        roles=["UI/UX Designer"],
        technologies=["Figma"],
    )

    ranked = rank_projects_for_member([design_project, backend_project], member)

    assert ranked[0][0].name == "Backend Project"
    assert ranked[0][1].total_score > ranked[1][1].total_score


# --------------------------------------------------------------------------
# 10. Score bounds and internal consistency
# --------------------------------------------------------------------------


def test_score_never_exceeds_100_or_drops_below_0(project):
    members = [
        make_member(name="Empty"),
        make_member(
            name="Maxed",
            skills={"Python": 5, "React": 5, "SQL": 5},
            interests=["AI", "Education", "Backend"],
            preferred_roles=["Backend Developer", "Frontend Developer"],
            learning_goals=["Python", "FastAPI", "Next.js"],
        ),
        make_member(name="Partial", skills={"Python": 9}, interests=["AI", "AI", "AI"]),
    ]

    for member in members:
        result = calculate_match(member, project)
        assert 0.0 <= result.total_score <= MAX_SCORE
        for component in (
            result.skill_score,
            result.interest_score,
            result.role_score,
            result.growth_score,
        ):
            assert component >= 0.0


def test_components_always_add_up_to_the_total(project):
    """The breakdown shown in the UI must equal the headline percentage."""
    member = make_member(
        skills={"Python": 4, "React": 2, "SQL": 2},
        interests=["AI", "Backend"],
        preferred_roles=["Backend Developer"],
        learning_goals=["Next.js"],
    )

    result = calculate_match(member, project)

    assert result.total_score == pytest.approx(
        result.skill_score
        + result.interest_score
        + result.role_score
        + result.growth_score
    )


def test_scoring_is_deterministic(project):
    """Same inputs, same output, every time. No randomness, no LLM."""
    member = make_member(
        skills={"Python": 4, "React": 2, "SQL": 3},
        interests=["AI"],
        preferred_roles=["Backend Developer"],
        learning_goals=["Docker"],
    )

    first = calculate_match(member, project)
    second = calculate_match(member, project)

    assert first == second
