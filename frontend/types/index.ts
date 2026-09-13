/**
 * TypeScript mirrors of the backend response schemas.
 *
 * Every type here corresponds to a class in `backend/app/schemas.py`. If you
 * change a schema on the backend, change it here too: this file is the only
 * description the frontend has of what the API returns.
 */

/** Skill name -> level from 1 (beginner) to 5 (strong). */
export type SkillLevels = Record<string, number>;

export interface Member {
  id: number;
  name: string;
  major: string;
  skills: SkillLevels;
  interests: string[];
  preferred_roles: string[];
  learning_goals: string[];
}

/** Body of POST /members. Same as Member without the server-assigned id. */
export type MemberInput = Omit<Member, "id">;

export interface Project {
  id: number;
  name: string;
  description: string;
  required_skills: SkillLevels;
  topics: string[];
  roles: string[];
  technologies: string[];
}

/** Body of POST /projects. */
export type ProjectInput = Omit<Project, "id">;

/** A required skill the member does not fully cover. */
export interface SkillGap {
  skill: string;
  required_level: number;
  member_level: number;
}

/** The matcher's output: four component scores plus the evidence behind them. */
export interface MatchScores {
  total_score: number;
  skill_score: number;
  interest_score: number;
  role_score: number;
  growth_score: number;
  matched_skills: string[];
  weak_or_missing_skills: SkillGap[];
  matched_interests: string[];
  matched_learning_goals: string[];
  reasons: string[];
  weaknesses: string[];
}

/** One entry from GET /projects/{id}/matches. */
export interface MemberMatch {
  rank: number;
  member: Member;
  scores: MatchScores;
}

/** One entry from GET /members/{id}/matches. */
export interface ProjectMatch {
  rank: number;
  project: Project;
  scores: MatchScores;
}

/** The maximum points each component can earn. Mirrors the matcher weights. */
export const SCORE_WEIGHTS = {
  skills: 60,
  interests: 20,
  role: 10,
  growth: 10,
} as const;
