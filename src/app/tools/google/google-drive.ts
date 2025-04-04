import { z } from "zod";
import { tool } from "ai";
import { getGoogleAuth } from "./get-google-token";
import * as google from "@googleapis/drive";

export const list_files = tool({
  description: "Get a list of files from Google Drive",
  parameters: z.object({
    pageSize: z.number().default(10).describe("The maximum number of files to return"),
  }),
  execute: async ({ pageSize }) => {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.list({
      pageSize,
      fields: "files(id, name, mimeType)",
    });

    return response.data.files;
  },
});

export const get_file_metadata = tool({
  description: "Get metadata for a file from Google Drive",
  parameters: z.object({
    fileId: z.string().describe("The ID of the file to get metadata for"),
  }),
  execute: async ({ fileId }) => {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, webViewLink",
    });

    return response.data;
  },
});

export const get_file_content = tool({
  description: "Get content for a file from Google Drive",
  parameters: z.object({
    fileId: z.string().describe("The ID of the file to get content for"),
  }),
  execute: async ({ fileId }) => {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.get({
      fileId,
      alt: "media",
    });

    return response.data;
  },
});
