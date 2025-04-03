import { toolInfo as google } from './google';
import { ToolSetInfo } from './toolset';

export const registry: Record<string, ToolSetInfo> = {
    [google.connectionName]: google,
};