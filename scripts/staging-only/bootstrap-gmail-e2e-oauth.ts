/**
 * One-time Gmail OAuth bootstrap for forge.operation@gmail.com readonly access.
 *
 * Usage:
 *   1) Put GMAIL_E2E_CLIENT_ID / GMAIL_E2E_CLIENT_SECRET into .env.preview-e2e.local
 *   2) npm run ops:bootstrap-gmail-e2e-oauth
 *   3) Open printed URL, approve as forge.operation@gmail.com
 *   4) Paste the redirect code when prompted
 *   5) Refresh token is appended to .env.preview-e2e.local (gitignored)
 *
 * Never prints client secret / refresh token.
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { loadPreviewE2EEnv, requireEnv } from "./lib/preview-e2e-env.ts";

const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const REDIRECT_URI = "http://127.0.0.1:53682/oauth2callback";
const PORT = 53682;

function upsertEnvLine(filePath: string, key: string, value: string) {
  let existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const lines = existing
    .split(/\r?\n/)
    .filter((line) => !line.startsWith(`${key}=`));
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  lines.push(`${key}=${value}`);
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, { encoding: "utf8" });
}

async function waitForCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
        if (url.pathname !== "/oauth2callback") {
          res.writeHead(404);
          res.end("not found");
          return;
        }
        const code = url.searchParams.get("code");
        const err = url.searchParams.get("error");
        if (err) {
          res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
          res.end("OAuth error. You can close this tab.");
          server.close();
          reject(new Error(`OAuth error: ${err}`));
          return;
        }
        if (!code) {
          res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
          res.end("Missing code");
          return;
        }
        res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
        res.end("Forge Gmail E2E OAuth OK. You can close this tab.");
        server.close();
        resolve(code);
      } catch (cause) {
        server.close();
        reject(cause);
      }
    });
    server.listen(PORT, "127.0.0.1");
    server.on("error", reject);
  });
}

async function main() {
  const env = loadPreviewE2EEnv();
  const clientId = requireEnv(env, "GMAIL_E2E_CLIENT_ID");
  const clientSecret = requireEnv(env, "GMAIL_E2E_CLIENT_SECRET");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");

  console.log("Listening on", REDIRECT_URI);
  console.log("Open this URL as forge.operation@gmail.com:\n");
  console.log(authUrl.toString());
  console.log("\nWaiting for consent redirect…");

  const code = await waitForCode();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error(`token exchange failed (${response.status})`);
  }
  const json = (await response.json()) as {
    refresh_token?: string;
  };
  if (!json.refresh_token) {
    throw new Error(
      "No refresh_token returned. Revoke prior grant and retry with prompt=consent.",
    );
  }

  const envPath = path.join(process.cwd(), ".env.preview-e2e.local");
  upsertEnvLine(envPath, "GMAIL_E2E_REFRESH_TOKEN", json.refresh_token);
  upsertEnvLine(envPath, "GMAIL_E2E_USER", "forge.operation@gmail.com");
  console.log(
    "Saved GMAIL_E2E_REFRESH_TOKEN to .env.preview-e2e.local (gitignored). Token not printed.",
  );
}

main().catch((cause) => {
  console.error(
    "bootstrap-gmail-e2e-oauth FAIL",
    cause instanceof Error ? cause.message : cause,
  );
  process.exit(1);
});
