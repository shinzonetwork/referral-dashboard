import type { NextRequest } from "next/server";

// Shared shared-secret-header check used by service-to-service endpoints
// (ingestion from ShinzoHub, reads from the future accounting service).
// Each caller uses its own token env var so credentials aren't shared across
// integrations.
export function hasValidServiceToken(
  request: NextRequest,
  headerName: string,
  envVarName: string,
): boolean {
  const token = request.headers.get(headerName);
  const expected = process.env[envVarName];
  return Boolean(token && expected && token === expected);
}
