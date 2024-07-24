import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";

// Initialize the OpenAPIHono app
const auth = new OpenAPIHono();

// Define the encodeKey route
const encodeKeyRoute = createRoute({
  method: "post",
  path: "/encodeKey",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              key: z.string().describe("The key to be Base64 encoded."),
            })
            .describe("Key data."),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Base64 encoded credentials",
      content: {
        "application/json": {
          schema: z.object({
            encodedCredentials: z
              .string()
              .describe("Base64 encoded credentials."),
          }),
        },
      },
    },
    400: {
      description: "Bad request, invalid input data",
    },
  },
});

// Define the verifyCredentials route
const verifyCredentialsRoute = createRoute({
  method: "post",
  path: "/verifyCredentials",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              encodedCredentials: z
                .string()
                .describe("Base64 encoded credentials."),
            })
            .describe("Credentials data."),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Credentials verified successfully",
      content: {
        "application/json": {
          schema: z.object({
            verified: z
              .boolean()
              .describe("Whether the credentials are valid."),
          }),
        },
      },
    },
    400: {
      description: "Bad request, invalid input data",
    },
    401: {
      description: "Unauthorized, invalid credentials",
    },
  },
});

// Implement the encodeKey functionality
auth.openapi(encodeKeyRoute, async (c) => {
  const { USERNAME } = env<{ USERNAME: string }>(c);
  try {
    // Get the key from the request body
    const { key } = await c.req.json<{ key: string }>();

    // Concatenate "iscba:" with the key
    const credentials = `${USERNAME}:${key}`;

    // Encode the concatenated string in Base64
    const encodedCredentials = btoa(credentials);

    // Respond with the Base64 encoded credentials
    return c.json({ encodedCredentials });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Error processing request" }, 400);
  }
});

// Implement the verifyCredentials functionality
auth.openapi(verifyCredentialsRoute, async (c) => {
  const { USERNAME, PASSWORD } = env<{
    USERNAME: string;
    PASSWORD: string;
  }>(c);
  try {
    // Get the Base64 encoded credentials from the request body
    const { encodedCredentials } = await c.req.json<{
      encodedCredentials: string;
    }>();

    // Decode the Base64 credentials
    const decodedCredentials = atob(encodedCredentials);

    // Split the credentials into username and key
    const [username, key] = decodedCredentials.split(":");

    // Check if the credentials match the expected values
    const isValid = username === USERNAME && key === PASSWORD;

    // Respond with the result of the verification
    return c.json({ verified: isValid });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Error processing request" }, 400);
  }
});

export default auth;
