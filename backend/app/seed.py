"""
Seed data.

The profiles below are stored as plain dictionaries and turned into rows
inside `seed_database()`, so the same module-level objects are never attached
to two different database sessions.

The profiles are deliberately uneven: a strong frontend designer, a
machine-learning person, a cloud/Java person, a product-minded analyst, and
so on. Each project is written so that a *different* member comes out on top,
which is the only way to tell whether the ranking is actually working.

`seed_database()` runs on startup and does nothing if data already exists, so
restarting the server never duplicates rows.
"""

from sqlmodel import Session, select

from .database import engine
from .models import Member, Project

MEMBERS = [
    dict(
        name="Alex Johnson",
        major="Computer Science",
        skills={"Python": 4, "SQL": 4, "React": 2, "FastAPI": 3},
        interests=["AI", "Backend", "FinTech"],
        preferred_roles=["Backend Developer"],
        learning_goals=["Next.js", "Docker"],
    ),
    dict(
        name="Sarah Lee",
        major="Information Science",
        skills={"React": 5, "Next.js": 4, "TypeScript": 4, "CSS": 4, "Figma": 3},
        interests=["Frontend", "UI/UX", "Education"],
        preferred_roles=["Frontend Developer"],
        learning_goals=["FastAPI", "Chart.js"],
    ),
    dict(
        name="Daniel Kim",
        major="Computer Science",
        skills={"Python": 5, "SQL": 3, "PyTorch": 4, "Machine Learning": 4, "Data Science": 4},
        interests=["AI", "Machine Learning", "Career"],
        preferred_roles=["Data/AI Engineer", "Backend Developer"],
        learning_goals=["FastAPI", "Docker"],
    ),
    dict(
        name="Emma Rodriguez",
        major="Graphic Design",
        skills={"Figma": 5, "CSS": 5, "React": 3, "HTML": 5},
        interests=["UI/UX", "Frontend", "Events"],
        preferred_roles=["UI/UX Designer"],
        learning_goals=["Next.js", "TypeScript"],
    ),
    dict(
        name="Michael Chen",
        major="Computer Engineering",
        skills={"Java": 4, "SQL": 3, "AWS": 3, "Docker": 3, "Python": 2},
        interests=["Backend", "Cloud", "Marketplace"],
        preferred_roles=["Backend Developer"],
        learning_goals=["FastAPI", "PostgreSQL"],
    ),
    dict(
        name="Priya Nair",
        major="Data Science",
        skills={"Python": 4, "SQL": 5, "Data Science": 5, "Tableau": 3},
        interests=["Data Analytics", "Education", "AI"],
        preferred_roles=["Data Analyst", "Data/AI Engineer"],
        learning_goals=["Chart.js", "Next.js", "FastAPI"],
    ),
    dict(
        name="Jordan Blake",
        major="Computer Science",
        skills={"JavaScript": 4, "React": 3, "Node.js": 4, "TypeScript": 3, "SQL": 2},
        interests=["Web Development", "Marketplace", "Events"],
        preferred_roles=["Full-Stack Developer", "Frontend Developer"],
        learning_goals=["PostgreSQL", "Next.js"],
    ),
    dict(
        name="Sofia Martinez",
        major="Business Information Systems",
        skills={"SQL": 3, "Tableau": 4, "Python": 2, "Figma": 2},
        interests=["Data Analytics", "Events", "Career"],
        preferred_roles=["Data Analyst", "Product Manager"],
        learning_goals=["Python", "Chart.js"],
    ),
    dict(
        name="Liam O'Connor",
        major="Computer Science",
        skills={"C++": 4, "Python": 3, "Docker": 2, "SQL": 2},
        interests=["Backend", "Cloud", "Machine Learning"],
        preferred_roles=["Backend Developer"],
        learning_goals=["FastAPI", "AWS", "PyTorch"],
    ),
    dict(
        name="Grace Park",
        major="Human-Computer Interaction",
        skills={"Figma": 4, "React": 4, "TypeScript": 3, "CSS": 4},
        interests=["UI/UX", "Education", "Events"],
        preferred_roles=["UI/UX Designer", "Frontend Developer"],
        learning_goals=["Next.js", "Supabase"],
    ),
]

PROJECTS = [
    dict(
        name="AI Study Planner",
        description=(
            "Web app that builds a personalised weekly study schedule from a "
            "student's courses, deadlines, and available hours."
        ),
        required_skills={"Python": 3, "React": 3, "SQL": 2},
        topics=["AI", "Education", "Backend"],
        roles=["Backend Developer", "Frontend Developer"],
        technologies=["Python", "FastAPI", "Next.js"],
    ),
    dict(
        name="Club Analytics Dashboard",
        description=(
            "Internal dashboard tracking event attendance, member retention, "
            "and project participation across the semester."
        ),
        required_skills={"SQL": 4, "Python": 3, "Data Science": 3},
        topics=["Data Analytics", "Education", "Backend"],
        roles=["Data Analyst", "Backend Developer"],
        technologies=["Python", "FastAPI", "Next.js", "Chart.js"],
    ),
    dict(
        name="Campus Marketplace",
        description=(
            "Peer-to-peer marketplace where students can list and find "
            "textbooks, furniture, and dorm essentials."
        ),
        required_skills={"TypeScript": 3, "React": 4, "Node.js": 3, "SQL": 2},
        topics=["Marketplace", "Web Development", "Frontend"],
        roles=["Full-Stack Developer", "Frontend Developer"],
        technologies=["TypeScript", "Next.js", "Node.js", "PostgreSQL"],
    ),
    dict(
        name="Event Management Platform",
        description=(
            "Tool for planning club events end to end: RSVPs, check-in, "
            "room bookings, and a post-event feedback form."
        ),
        required_skills={"React": 3, "Figma": 3, "SQL": 2},
        topics=["Events", "UI/UX", "Frontend"],
        roles=["UI/UX Designer", "Frontend Developer"],
        technologies=["Next.js", "TypeScript", "Figma", "Supabase"],
    ),
    dict(
        name="AI Resume Analyzer",
        description=(
            "Uploads a resume and a job description, then scores the match and "
            "suggests concrete wording improvements."
        ),
        required_skills={"Python": 4, "Machine Learning": 3, "FastAPI": 2},
        topics=["AI", "Machine Learning", "Career"],
        roles=["Data/AI Engineer", "Backend Developer"],
        technologies=["Python", "FastAPI", "PyTorch", "Docker"],
    ),
]


def seed_database() -> None:
    """
    Insert the sample data, but only into an empty table.

    Checked per table rather than once for the whole database, so adding a new
    seed project later does not require wiping the members.
    """
    with Session(engine) as session:
        if session.exec(select(Member)).first() is None:
            for data in MEMBERS:
                session.add(Member(**data))

        if session.exec(select(Project)).first() is None:
            for data in PROJECTS:
                session.add(Project(**data))

        session.commit()
