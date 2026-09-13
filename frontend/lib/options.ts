/**
 * The controlled vocabularies used by both forms.
 *
 * Matching is string based, so "React" and "ReactJS" would score as two
 * unrelated skills. Offering a fixed list instead of a free text box is the
 * cheapest way to keep the data consistent enough for the scores to mean
 * anything. These lists intentionally cover everything in the seed data.
 */

export const SKILL_OPTIONS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "SQL",
  "Java",
  "C++",
  "FastAPI",
  "PostgreSQL",
  "Figma",
  "CSS",
  "HTML",
  "AWS",
  "Docker",
  "Data Science",
  "Machine Learning",
  "PyTorch",
  "Tableau",
] as const;

export const TOPIC_OPTIONS = [
  "AI",
  "Machine Learning",
  "Backend",
  "Frontend",
  "Web Development",
  "Data Analytics",
  "UI/UX",
  "Cloud",
  "Education",
  "Events",
  "Marketplace",
  "Career",
  "FinTech",
] as const;

export const ROLE_OPTIONS = [
  "Backend Developer",
  "Frontend Developer",
  "Full-Stack Developer",
  "UI/UX Designer",
  "Data Analyst",
  "Data/AI Engineer",
  "Product Manager",
] as const;

export const TECHNOLOGY_OPTIONS = [
  "Python",
  "FastAPI",
  "Next.js",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "Supabase",
  "Chart.js",
  "PyTorch",
  "Docker",
  "AWS",
  "Figma",
] as const;

/** Labels for the 1-5 skill scale, used in both the forms and the badges. */
export const SKILL_LEVEL_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Basic",
  3: "Intermediate",
  4: "Advanced",
  5: "Strong",
};
