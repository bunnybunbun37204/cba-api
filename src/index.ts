import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { basicAuth } from "hono/basic-auth";
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import line from "./line";
import file from "./file";
import auth64 from "./auth";
import { env } from "hono/adapter";
import { rateLimiter } from "./utils";

// Type definitions for bindings
type Bindings = {
  MY_BUCKET: R2Bucket;
};

// Initialize the OpenAPIHono app
const app = new OpenAPIHono<{ Bindings: Bindings }>();

// Apply middleware
app.use(rateLimiter);
app.use("/*", cors());
app.use(logger());

// Basic Authentication Middleware
const auth = basicAuth({
  verifyUser: (username, password, c) => {
    const { USERNAME, PASSWORD } = env<{ USERNAME: string; PASSWORD: string }>(
      c,
      "workerd"
    );
    return username === USERNAME && password === PASSWORD;
  },
});

// Define routes with authentication
app.use("/line/*", auth);
app.use("/file/upload", auth);
app.route("/line", line);
app.route("/file", file);
app.route("/auth", auth64);

// OpenAPI Documentation
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "rolling",
    title: "CBA chula API",
   description: "This is API for IS department at CBA chula ",
    license: {
      name: "License",
      url: "https://github.com/bunnybunbun37204/cba-api/blob/main/LICENSE.md",
    },
    contact: {
      email: "bunyawatapp37204@gmail.com",
      name: "Bunyawat Naunnak",
      url: "https://github.com/bunnybunbun37204",
    },
  },
});

// Swagger UI
app.get("/", swaggerUI({ url: "/doc" }));

// 404 Not Found Handler
app.notFound((c) => {
  return c.json({ message: "Not Found" }, 404);
});

// Error Handling Middleware
app.onError((err, c) => {
  console.error(err);
  return c.json({ message: "Internal Server Error" }, 500);
});

export default app;
