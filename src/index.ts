import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import line from "./line";
import file from "./file";

type Bindings = {
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("/*", cors());
app.use(logger());

// Define the index route with summary and links
app.get("/", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CBA API Documentation</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
            }
            h1 {
                font-size: 24px;
            }
            ul {
                list-style: none;
                padding: 0;
            }
            li {
                margin-bottom: 10px;
            }
            a {
                text-decoration: none;
                color: #007BFF;
            }
            a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <h1>CBA API Documentation</h1>
        <ul>
            <li><a href="/line/docs" target="_blank">Line API Documentation</a></li>
            <li><a href="/file/docs" target="_blank">File API Documentation</a></li>
        </ul>
    </body>
    </html>
  `);
});

app.route("/line", line);
app.route("/file", file);

export default app;
