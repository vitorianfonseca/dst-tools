export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface LocalUser {
  id: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
  };
}

export interface LocalProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  banner_url: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalWorkspace {
  id: string;
  user_id: string;
  name: string;
  visibility: "public" | "private";
  data: Json;
  created_at: string;
  updated_at: string;
  owner_name?: string;
}

const STORAGE_KEYS = {
  user: "dst-local-user",
  profiles: "dst-local-profiles",
  workspaces: "dst-local-workspaces",
};

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function nowIso() {
  return new Date().toISOString();
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalUser(): LocalUser | null {
  return loadJson<LocalUser | null>(STORAGE_KEYS.user, null);
}

export function setLocalUser(user: LocalUser | null) {
  if (!isBrowser()) return;
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.user);
    return;
  }
  saveJson(STORAGE_KEYS.user, user);
}

export function ensureLocalUser(email?: string, displayName?: string): LocalUser {
  const existing = getLocalUser();
  if (existing) return existing;

  const user: LocalUser = {
    id: randomId(),
    email: email || "local@dst.tools",
    user_metadata: {
      display_name: displayName || "Utilizador",
    },
  };

  setLocalUser(user);
  return user;
}

export function getProfiles(): LocalProfile[] {
  return loadJson<LocalProfile[]>(STORAGE_KEYS.profiles, []);
}

export function saveProfiles(profiles: LocalProfile[]) {
  saveJson(STORAGE_KEYS.profiles, profiles);
}

export function ensureProfile(user: LocalUser): LocalProfile {
  const profiles = getProfiles();
  const existing = profiles.find((profile) => profile.id === user.id);
  if (existing) return existing;

  const profile: LocalProfile = {
    id: user.id,
    display_name: user.user_metadata?.display_name || "Utilizador",
    avatar_url: null,
    bio: null,
    banner_url: null,
    is_private: false,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  profiles.push(profile);
  saveProfiles(profiles);
  return profile;
}

export function updateProfile(id: string, updates: Partial<LocalProfile>) {
  const profiles = getProfiles();
  const index = profiles.findIndex((profile) => profile.id === id);
  if (index === -1) return null;

  const updated = {
    ...profiles[index],
    ...updates,
    updated_at: nowIso(),
  };
  profiles[index] = updated;
  saveProfiles(profiles);
  return updated;
}

export function findProfilesByName(query: string, excludeId?: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [] as LocalProfile[];

  return getProfiles().filter((profile) => {
    if (excludeId && profile.id === excludeId) return false;
    return (profile.display_name || "").toLowerCase().includes(normalized);
  });
}

export function getWorkspaces(): LocalWorkspace[] {
  return loadJson<LocalWorkspace[]>(STORAGE_KEYS.workspaces, []);
}

export function saveWorkspaces(workspaces: LocalWorkspace[]) {
  saveJson(STORAGE_KEYS.workspaces, workspaces);
}

export function createWorkspace(userId: string, name: string, visibility: "public" | "private", data: Json = {}) {
  const workspaces = getWorkspaces();
  const workspace: LocalWorkspace = {
    id: randomId(),
    user_id: userId,
    name,
    visibility,
    data,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  workspaces.unshift(workspace);
  saveWorkspaces(workspaces);
  return workspace;
}

export function updateWorkspace(id: string, updates: Partial<Omit<LocalWorkspace, "id" | "user_id" | "created_at">>) {
  const workspaces = getWorkspaces();
  const index = workspaces.findIndex((workspace) => workspace.id === id);
  if (index === -1) return null;

  const updated = {
    ...workspaces[index],
    ...updates,
    updated_at: nowIso(),
  };
  workspaces[index] = updated;
  saveWorkspaces(workspaces);
  return updated;
}

export function deleteWorkspace(id: string) {
  const workspaces = getWorkspaces();
  const next = workspaces.filter((workspace) => workspace.id !== id);
  saveWorkspaces(next);
  return next.length !== workspaces.length;
}

export function updateWorkspaceData(id: string, data: Json) {
  return updateWorkspace(id, { data });
}
