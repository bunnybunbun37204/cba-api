export type Type = {
  mimeType: string;
  suffix: string;
};

const signatures: Record<string, Type> = {
  R0lGODdh: { mimeType: "image/gif", suffix: "gif" },
  R0lGODlh: { mimeType: "image/gif", suffix: "gif" },
  iVBORw0KGgo: { mimeType: "image/png", suffix: "png" },
  "/9j/": { mimeType: "image/jpg", suffix: "jpg" },
  "UklGRg==": { mimeType: "image/webp", suffix: "webp" },
  JVBERi0xLjQK: { mimeType: "application/pdf", suffix: "pdf" },
  AAABAAEAEBAAA: { mimeType: "audio/wav", suffix: "wav" },
  TVqQAAMAAAAEAAAA: { mimeType: "video/mp4", suffix: "mp4" },
  fZCjDZO7M4Z4gI0: { mimeType: "application/zip", suffix: "zip" },
  UEsDBBQAAAA: {
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    suffix: "docx",
  },
  SUQzBAAAAAAA: { mimeType: "audio/mpeg", suffix: "mp3" }, // MP3
  VGV4dCBmaWxl: { mimeType: "text/plain", suffix: "txt" }, // Text
};

export const detectType = (b64: string): Type | undefined => {
  for (const s in signatures) {
    if (b64.indexOf(s) === 0) {
      return signatures[s];
    }
  }
};

// Rate Limiter Configuration
const RATE_LIMIT = 1000; // Max requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// In-memory store for rate limiting
const requestCounts: Record<string, { count: number; timestamp: number }> = {};

// Rate Limiting Middleware
export const rateLimiter = async (c: any, next: () => Promise<any>) => {
  const ip = c.req.ip; // or use c.req.headers.get('X-Forwarded-For') if available

  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!requestCounts[ip]) {
    requestCounts[ip] = { count: 1, timestamp: now };
  } else {
    if (requestCounts[ip].timestamp < windowStart) {
      // Reset count and timestamp if window has passed
      requestCounts[ip] = { count: 1, timestamp: now };
    } else {
      // Increment request count
      requestCounts[ip].count += 1;
    }
  }

  if (requestCounts[ip].count > RATE_LIMIT) {
    return c.json({ message: "Rate limit exceeded" }, 429);
  }

  return next();
};
