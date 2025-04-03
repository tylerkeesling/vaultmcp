export enum TOOLSET_TYPE {
    MCP_SERVER = "mcp",
    BUILT_IN = "built-in"
}

export interface ToolSetInfo {
    connectionName: string;
    connectionScopes: string[];

    icon: string;
    type: TOOLSET_TYPE;
    name: string;
    contributedBy: string;
    description: string;
}
