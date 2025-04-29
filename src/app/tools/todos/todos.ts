import { z } from "zod";
import { tool } from "ai";
import { PrismaClient } from "@prisma/client";
import { auth0 } from "@/lib/auth0";

const prisma = new PrismaClient();

export const createTodo = tool({
  description: "Create a new Todo item",
  parameters: z.object({
    title: z.string().describe("Title for the Todo"),
    description: z.string().optional().describe("The task to perform"),
    tags: z.string().optional().describe("A hashtag associated with it like #job #personal"),
  }),
  execute: async ({ title, description, tags }) => {
    const session = await auth0.getSession();
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        description,
        tags: tags ?? "",
        user: {
          connectOrCreate: {
            create: { id: session.user.sub },
            where: { id: session.user.sub },
          },
        },
      },
    });

    return JSON.stringify(todo, null, 2);
  },
});

export const searchTodo = tool({
  description: "Search Todo items",
  parameters: z.object({
    search: z.string().optional().describe("Search title or description"),
    tags: z.string().optional().describe("Comma-separated list of tags"),
  }),
  execute: async ({ search, tags }) => {
    const session = await auth0.getSession();
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    const todos = await prisma.todo.findMany({
      where: {
        userId: session.user.sub,
        AND: [
          search
            ? {
                OR: [{ title: { contains: search } }, { description: { contains: search } }],
              }
            : {},
          tags
            ? {
                tags: { contains: tags },
              }
            : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return JSON.stringify(todos, null, 2);
  },
});

export const updateTodo = tool({
  description: "Update an existing Todo item",
  parameters: z.object({
    id: z.string().describe("ID of the Todo to update"),
    title: z.string().optional().describe("Updated title"),
    description: z.string().optional().describe("Updated task"),
    tags: z.string().optional().describe("Updated tags"),
    completed: z.boolean().optional().describe("Mark as complete or not"),
  }),
  execute: async ({ id, title, description, tags, completed }) => {
    const session = await auth0.getSession();
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    const existing = await prisma.todo.findFirst({
      where: { id, userId: session.user.sub },
    });
    if (!existing) return "Todo not found";

    const updated = await prisma.todo.update({
      where: { id },
      data: { title, description, tags, completed },
    });

    return JSON.stringify(updated, null, 2);
  },
});

export const deleteTodo = tool({
  description: "Delete a Todo item",
  parameters: z.object({
    id: z.string().describe("ID of the Todo to delete"),
  }),
  execute: async ({ id }) => {
    const session = await auth0.getSession();
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    const existing = await prisma.todo.findFirst({
      where: { id, userId: session.user.sub },
    });
    if (!existing) return "Todo not found";

    await prisma.todo.delete({ where: { id } });

    return "Todo deleted successfully.";
  },
});
