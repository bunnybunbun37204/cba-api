import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";

const line = new OpenAPIHono();

// Define the sendMessage route
const sendMessageRoute = createRoute({
  method: "post",
  path: "/sendMessage",
  tags: ["Line"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              message: z.string().describe("The message to send."),
            })
            .describe("Message data."),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Message sent successfully",
    },
    400: {
      description: "Bad request, invalid input data",
    },
    500: {
      description: "Internal server error",
    },
  },
});

// Implement the sendMessage functionality
line.openapi(sendMessageRoute, async (c) => {
  const { TOKEN } = env<{ TOKEN: string }>(c, "workerd");
  const data = await c.req.json<{ message: string }>();
  const message = new FormData();
  message.append("message", data.message);
  message.append("stickerPackageId", "446");
  message.append("stickerId", "2006");

  await fetch("https://notify-api.line.me/api/notify", {
    method: "post",
    body: message,
    headers: {
      Authorization: "Bearer " + TOKEN,
    },
  });

  return c.text("OK");
});

export default line;
