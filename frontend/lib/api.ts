/**
 * The only place in the frontend that talks to the backend.
 *
 * Every page and component imports a named function from here instead of
 * calling fetch() directly. That means the base URL, the error handling and
 * the response types are defined once.
 */

import type {
  Member,
  MemberInput,
  MemberMatch,
  Project,
  ProjectInput,
  ProjectMatch,
} from "@/types";

/**
 * Read at build/render time from .env.local. The NEXT_PUBLIC_ prefix is what
 * allows Next.js to expose the value to code running in the browser.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** An error carrying the HTTP status, so pages can treat 404 differently. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Shared fetch wrapper.
 *
 * Turns three different failure modes into one predictable ApiError:
 *   - the backend is not running at all (fetch itself throws)
 *   - the backend answered with 4xx/5xx
 *   - the backend answered with something that is not JSON
 */
interface RequestOptions {
  method?: "GET" | "POST";
  /** Already JSON.stringify-ed by the caller. */
  body?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      body: options.body,
      // Always ask the backend for fresh data; rankings change as members are added.
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    throw new ApiError(
      `Cannot reach the SpartanMatch API at ${API_URL}. Start the backend with ` +
        `"uvicorn app.main:app --reload" and try again.`,
      0,
    );
  }

  if (!response.ok) {
    // FastAPI puts its error text in a "detail" field.
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") {
        detail = body.detail;
      }
    } catch {
      // Response had no JSON body; keep the generic message.
    }
    throw new ApiError(detail, response.status);
  }

  return (await response.json()) as T;
}

// --------------------------------------------------------------------------
// Members
// --------------------------------------------------------------------------

export function getMembers(): Promise<Member[]> {
  return request<Member[]>("/members");
}

export function getMember(id: number): Promise<Member> {
  return request<Member>(`/members/${id}`);
}

export function createMember(member: MemberInput): Promise<Member> {
  return request<Member>("/members", {
    method: "POST",
    body: JSON.stringify(member),
  });
}

/** Rank every project for one member. */
export function getMemberMatches(id: number): Promise<ProjectMatch[]> {
  return request<ProjectMatch[]>(`/members/${id}/matches`);
}

// --------------------------------------------------------------------------
// Projects
// --------------------------------------------------------------------------

export function getProjects(): Promise<Project[]> {
  return request<Project[]>("/projects");
}

export function getProject(id: number): Promise<Project> {
  return request<Project>(`/projects/${id}`);
}

export function createProject(project: ProjectInput): Promise<Project> {
  return request<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(project),
  });
}

/** Rank every member for one project. This powers the project detail page. */
export function getProjectMatches(id: number): Promise<MemberMatch[]> {
  return request<MemberMatch[]>(`/projects/${id}/matches`);
}
