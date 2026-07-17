export { WORK_PROJECTS } from "./focused-work.js";
export type { WorkProject } from "./focused-work.js";

import { WORK_PROJECTS } from "./focused-work.js";

/**
 * First-party journals intentionally do not expose private repository links.
 * This compatibility count remains zero for callers that distinguish public
 * source snapshots from maintainer-authored project summaries.
 */
export const PUBLIC_WORK_COUNT = 0;

export function getWorkProject(slug: string) {
  const normalized = slug.trim().toLocaleLowerCase("en-US");
  return WORK_PROJECTS.find((project) => project.slug === normalized);
}
