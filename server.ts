import express from "express";
import path from "path";
import http from "node:http";
import { spawn, ChildProcess } from "node:child_process";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const FASTAPI_PORT = 8000;
const FASTAPI_HOST = "127.0.0.1";

let fastapiProcess: ChildProcess | null = null;

// Launch canonical Python FastAPI backend on port 8000
function launchFastAPIBackend() {
  console.log("[ProcessManager] Spawning canonical Python FastAPI backend on 127.0.0.1:8000...");
  const pythonPath = path.resolve(process.cwd(), "backend");

  fastapiProcess = spawn(
    "python3",
    ["-m", "uvicorn", "app.main:app", "--host", FASTAPI_HOST, "--port", String(FASTAPI_PORT)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PYTHONPATH: pythonPath,
      },
      stdio: "inherit",
    }
  );

  fastapiProcess.on("error", (err) => {
    console.error("[ProcessManager] Failed to spawn FastAPI process:", err);
  });

  fastapiProcess.on("exit", (code, signal) => {
    console.warn(`[ProcessManager] FastAPI process terminated (code: ${code}, signal: ${signal})`);
  });
}

// Graceful cleanup
function cleanup() {
  if (fastapiProcess && !fastapiProcess.killed) {
    console.log("[ProcessManager] Stopping FastAPI backend process...");
    fastapiProcess.kill("SIGTERM");
  }
}
process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});

// Reverse proxy /api requests to FastAPI backend BEFORE any body parsers
app.use("/api", (req, res) => {
  const targetPath = `/api${req.url}`;

  // Filter hop-by-hop headers
  const reqHeaders: Record<string, string | string[] | undefined> = {
    ...req.headers,
    host: `${FASTAPI_HOST}:${FASTAPI_PORT}`,
  };

  const options: http.RequestOptions = {
    hostname: FASTAPI_HOST,
    port: FASTAPI_PORT,
    path: targetPath,
    method: req.method,
    headers: reqHeaders,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error(`[ProxyError] Failed to forward ${req.method} ${targetPath}:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({
        detail: "The canonical Python FastAPI backend is initializing or unreachable. Please retry in a moment.",
        error: err.message,
      });
    }
  });

  req.pipe(proxyReq, { end: true });
});

// App server bootstrap
async function startAppServer() {
  launchFastAPIBackend();

  if (process.env.NODE_ENV !== "production") {
    console.log("[Vite] Mounting Vite middleware in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Production] Serving static files from dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Invoice Analyzer unified app running at http://0.0.0.0:${PORT}`);
    console.log(`Canonical Python FastAPI backend proxied at /api -> http://127.0.0.1:${FASTAPI_PORT}/api`);
  });
}

startAppServer().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
