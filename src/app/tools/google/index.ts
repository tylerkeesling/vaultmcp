import { TOOLSET_TYPE, ToolSetInfo } from '../toolset';
import {
  GOOGLE_CONNECTION_NAME
} from './get-google-token';
import * as calendar from './google-calendar';
import * as drive from './google-drive';


export const toolInfo: ToolSetInfo = {
  connectionName: GOOGLE_CONNECTION_NAME,
  connectionScopes: [
    // @todo: generate these scopes dynamically
    ''
  ],


  name: "Google",
  type: TOOLSET_TYPE.BUILT_IN,
  icon: '/icons/Google.png',

  description: "Acccess to Google's APIs",

  contributedBy: "Karan Chhina",
};

export const tools = {
  ...calendar,
  ...drive,
}
