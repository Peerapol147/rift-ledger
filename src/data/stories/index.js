// Story chains: a fixed run of chapters for a career, class or hunter role. Spec §4.1 (3).
import { CAREER_STORIES } from "./careers.js";
import { HUNTER_STORIES } from "./hunters.js";

export const STORIES = { ...CAREER_STORIES, ...HUNTER_STORIES };
