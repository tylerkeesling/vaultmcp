import { TOOLSET_TYPE, ToolSetInfo } from '../toolset';
import {
  GITHUB_CONNECTION_NAME
} from './get-github-token';

import * as userTools from './user-tools';
import * as repoTools from './repo-tools';

export const toolInfo: ToolSetInfo = {
  connectionName: GITHUB_CONNECTION_NAME,
  connectionScopes: [
    // @todo: generate these scopes dynamically
    ''
  ],


  name: "Github",
  type: TOOLSET_TYPE.BUILT_IN,
  icon: '/icons/Github.png',

  description: "Acccess to Githubs APIs",

  contributedBy: "Auth0 ProdArch",
};

export const tools = {
  ...userTools,
  ...repoTools,
}
