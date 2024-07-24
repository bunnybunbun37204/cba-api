import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { sha256 } from "hono/utils/crypto";
import { detectType } from "./utils";
import { cache } from "hono/cache";

type Bindings = {
  DB: D1Database;
  MY_BUCKET: R2Bucket;
};

type Data = {
  body: string;
  width?: string;
  height?: string;
};

const maxAge = 60 * 60 * 24 * 90;
const file = new OpenAPIHono<{ Bindings: Bindings }>();

// Define the OpenAPI documentation
file.doc("/", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "File upload and get API",
    description: "API for uploading base64 encoded files.",
  },
});

// Define the file upload route with example data
const fileUploadRoute = createRoute({
  method: "put",
  path: "/upload",
  tags: ["File"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              body: z.string(),
              width: z.string().optional(),
              height: z.string().optional(),
            })
            .describe(
              "File upload data, including base64 encoded file and optional dimensions."
            ),
          examples: {
            "application/json": {
              summary: "Example file upload data",
              value: {
                body: "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNq7YAAAAAElFTkSuQmCC",
                width: "100",
                height: "100",
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "File successfully uploaded",
      content: {
        "application/json": {
          schema: z.object({
            key: z
              .string()
              .describe("The key of the uploaded file in the bucket."),
          }),
          examples: {
            "application/json": {
              summary: "Example response for file upload",
              value: {
                key: "d2d2d2d2_100x100.png",
              },
            },
          },
        },
      },
    },
    404: {
      description: "File not found or invalid base64 data",
    },
    400: {
      description: "Bad request, invalid input data",
    },
  },
});

// Implement the file upload functionality
file.openapi(fileUploadRoute, async (c) => {
  const data = await c.req.json<Data>();
  const base64 = data.body;
  if (!base64) return c.notFound();

  const type = detectType(base64);
  const body = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  let key;
  if (data.width && data.height) {
    key =
      (await sha256(body)) +
      `_${data.width}x${data.height}` +
      "." +
      type?.suffix;
  } else {
    key = (await sha256(body)) + "." + type?.suffix;
  }

  await c.env.MY_BUCKET.put(key, body, {
    httpMetadata: { contentType: type?.mimeType },
  });

  return c.json({ key });
});

// Define the image retrieval route with example data
const imageRetrievalRoute = createRoute({
  method: "get",
  path: "/views/{key}",
  tags: ["File"],
  request: {
    params: z.object({
      key: z.string().describe("The unique key of the image in the bucket."),
    }),
  },
  responses: {
    200: {
      description: "Image successfully retrieved",
      content: {
        "image/*": {
          schema: z.string().describe("The image data in binary format."),
          examples: {
            "image/png": {
              summary: "Example image data",
              value:
                "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNq7YAAAAAElFTkSuQmCC",
            },
          },
        },
      },
      headers: {
        "Cache-Control": {
          description: "Cache control settings",
        },
        "Content-Type": {
          description: "MIME type of the image",
        },
      },
    },
    404: {
      description: "Image not found",
    },
    500: {
      description: "Internal server error",
    },
  },
});

// Define a route to handle GET requests for files
file.get(
  "*", // Wildcard route to match all paths under /file
  cache({
    cacheName: "r2-image-worker", // Cache configuration for storing and retrieving files
  })
);

// Implement the image retrieval functionality
file.openapi(imageRetrievalRoute, async (c) => {
  const key = c.req.param("key");

  const object = await c.env.MY_BUCKET.get(key);
  if (!object) return c.notFound();

  const data = await object.arrayBuffer();
  const contentType = object.httpMetadata?.contentType ?? "";

  return c.body(data, 200, {
    "Cache-Control": `public, max-age=${maxAge}`,
    "Content-Type": contentType,
  });
});

export default file;
