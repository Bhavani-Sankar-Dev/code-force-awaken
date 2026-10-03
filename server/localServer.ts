import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "node:path";
import { app } from "../server.ts";

const DEFAULT_PORT = 3000;
const PORT = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT;
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(
    `Invalid PORT value "${process.env.PORT}". Set PORT to a number between 1 and 65535.`,
  );
}

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve(process.cwd(), "dist")));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `CODE FORCE AWAKEN website available at http://localhost:${PORT}`,
    );
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the other server or set PORT to another available port.`,
      );
    } else {
      console.error("Failed to start CODE FORCE AWAKEN server:", err);
    }
    process.exitCode = 1;
  });
}

void startServer();
