const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type User = { id: string; name: string; email: string; created_at: string };

export type Scenario = "website" | "data";

export type Frequency = "daily" | "weekly" | "bi-weekly" | "3x-week" | "2x-week" | "monthly";
export type ContentLength = "short" | "medium" | "long" | "longform";
export type Tone = "professional" | "casual" | "educational" | "humorous" | "inspirational" | "journalistic";

export interface UserStats {
  user_id: string;
  agent_count: number;
  agent_limit: number;
  agents_remaining: number;
  total_blogs_generated: number;
  total_posts_scheduled: number;
  can_create_agent: boolean;
}

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  scenario: Scenario;
  website_url?: string;
  themes?: string[];
  tone: string;
  audience: string;
  language: string;
  duration_months: number;
  frequency: string;
  content_length: string;
  brand_name?: string;
  status: string;
  created_at: string;
}

export interface ScheduleEntry {
  id: string;
  agent_id: string;
  user_id: string;
  scheduled_date: string;
  title: string;
  description: string;
  keywords: string[];
  word_count: number;
  status: string;
}

export interface Blog {
  id: string;
  agent_id: string;
  user_id: string;
  scheduled_date: string;
  title: string;
  meta_description: string;
  content: string;
  tags: string[];
  reading_time_minutes: number;
  created_at: string;
}

export interface CreateAgentInput {
  name: string;
  scenario: Scenario;
  website_url?: string;
  themes?: string[];
  duration_months: number;
  frequency: Frequency;
  content_length: ContentLength;
  tone: Tone;
  audience: string;
  language: string;
  brand_name?: string;
  brand_description?: string;
}

// ── User stats ────────────────────────────────────────────────────────────────

export function getUserStats(userId: string) {
  return request<UserStats>(`/api/${userId}/stats`);
}

// ── Tools ─────────────────────────────────────────────────────────────────────

export interface ScrapeResult {
  url: string;
  title: string;
  description: string;
  headings: string[];
  body_text: string;
  word_count: number;
}

export function scrapeWebsite(url: string) {
  return request<ScrapeResult>("/api/scrape", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

// ── Agents ────────────────────────────────────────────────────────────────────

export function createAgent(userId: string, data: CreateAgentInput) {
  return request<{
    agent_id: string; agent: Agent; total_posts: number;
    schedule_preview: ScheduleEntry[]; message: string;
    agents_used: number; agents_remaining: number; daily_endpoint: string;
  }>(`/api/${userId}/agents`, { method: "POST", body: JSON.stringify(data) });
}

export function listAgents(userId: string) {
  return request<{
    agents: Agent[]; agent_count: number; agent_limit: number;
    agents_remaining: number; total_blogs_generated: number;
  }>(`/api/${userId}/agents`);
}

export function getAgent(userId: string, agentId: string) {
  return request<{
    agent: Agent; schedule: ScheduleEntry[]; total_posts: number;
    published: number; pending: number; daily_endpoint: string;
  }>(`/api/${userId}/${agentId}`);
}

export function deleteAgent(userId: string, agentId: string) {
  return request<{ message: string }>(`/api/${userId}/${agentId}`, { method: "DELETE" });
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export function getTodaysBlog(userId: string, agentId: string, targetDate?: string) {
  const q = targetDate ? `?target_date=${targetDate}` : "";
  return request<Blog>(`/api/${userId}/${agentId}/blog/today${q}`);
}

export function getLatestBlog(userId: string, agentId: string) {
  return request<Blog>(`/api/${userId}/${agentId}/blog/latest`);
}

export function getAgentSchedule(userId: string, agentId: string) {
  return request<{ agent: Agent; schedule: ScheduleEntry[]; total: number }>(
    `/api/${userId}/${agentId}/schedule`
  );
}

export interface BlogSummary {
  id: string;
  agent_id: string;
  user_id: string;
  scheduled_date: string;
  title: string;
  meta_description: string;
  tags: string[];
  reading_time_minutes: number;
  created_at: string;
}

export interface DashboardData {
  stats: {
    agent_count: number;
    agent_limit: number;
    agents_remaining: number;
    total_blogs_generated: number;
    total_posts_scheduled: number;
    can_create_agent: boolean;
  };
  agents: (Agent & { blogs_generated: number })[];
  recent_blogs: BlogSummary[];
  upcoming_posts: ScheduleEntry[];
  chart_data: { date: string; count: number }[];
}

export function getDashboard(userId: string) {
  return request<DashboardData>(`/api/${userId}/dashboard`);
}

export function getGeneratedBlogs(userId: string, agentId: string) {
  return request<{ blogs: BlogSummary[]; total: number }>(
    `/api/${userId}/${agentId}/blogs`
  );
}

