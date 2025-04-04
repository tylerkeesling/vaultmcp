import { TOOLSET_TYPE, ToolSetInfo } from '../toolset';
import {
  ZOOM_CONNECTION_NAME
} from './get-zoom-token';


export const toolInfo: ToolSetInfo = {
  connectionName: ZOOM_CONNECTION_NAME,
  connectionScopes: [
    // @todo: generate these scopes dynamically
    ''
  ],


  name: "Zoom",
  type: TOOLSET_TYPE.BUILT_IN,
  icon: '/icons/Zoom.png',

  description: "Acccess to Zoom APIs",

  contributedBy: "Auth0 ProdArch",
};

export const tools = {
}
