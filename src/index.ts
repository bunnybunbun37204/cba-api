import { cors } from "hono/cors";
import { logger } from "hono/logger";
import line from "./line";
import file from "./file";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";

type Bindings = {
  MY_BUCKET: R2Bucket;
};

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.route("/line", line);
app.route("/file", file);

// The openapi.json will be available at /doc
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "CBA chula API",
    description: "This is API for IS department at CBA chula",
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

app.use("/*", cors());
app.use(logger());

app.get("/", swaggerUI({ url: "/doc" }));

export default app;
