import { toolInfo as google } from "./google";
import { toolInfo as github } from "./github";
import { toolInfo as zoom } from "./zoom";

import { ToolSetInfo } from "./toolset";

/**
 * Connect Github
 */
export const registry: Record<string, ToolSetInfo> = {
  [google.connectionName]: google,
  [github.connectionName]: github,
  [zoom.connectionName]: zoom,
};
