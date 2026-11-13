// Branching stories (data only; core/narrative.js runs them). Spec: 2026-11-13-lives-that-remember-design.md.
import { OFFICE } from "./office.js";

export const STORY_DEFS = { office: OFFICE };
// Old chapter chains replaced by a story above: core/stories.js skips them for a life that started the story.
export const MIGRATED = ["office"];
