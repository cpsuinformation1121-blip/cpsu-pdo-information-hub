import { isR2PreconditionFailed } from "../repository/r2Errors.ts";
import {
  AdminAuthorizationError,
  authenticateAdminRequest,
} from "../auth/authenticateAdminRequest.ts";
import {
  recordAuditEvent,
  type AuditAction,
} from "../security/auditLog.ts";
import { InvalidJsonBodyError, readLimitedJson, RequestBodyTooLargeError } from "./readLimitedJson.ts";

type RuntimeSchema<Data> = {
  safeParse: (
    value: unknown,
  ) => { success: true; data: Data } | { success: false };
};

type AdminReportHandlerOptions<Data> = {
  schema: RuntimeSchema<Data>;
  read: (environment?: NodeJS.ProcessEnv) => Promise<Data>;
  write: (
    payload: unknown,
    environment?: NodeJS.ProcessEnv,
  ) => Promise<Data>;
  readSnapshot?: (environment?: NodeJS.ProcessEnv) => Promise<{ data: Data; revision: string }>;
  writeSnapshot?: (payload: unknown, environment: NodeJS.ProcessEnv, revision: string) => Promise<{ data: Data; revision: string }>;
  invalidRequestMessage: string;
  unavailableCode: string;
  unavailableMessage: string;
  auditAction: AuditAction;
  auditTarget: string;
};

type AdminReportDependencies = {
  audit?: typeof recordAuditEvent;
};

const privateHeaders = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8",
};

function json(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...privateHeaders, ...extraHeaders },
  });
}

export function createAdminReportResourceHandler<Data>(
  options: AdminReportHandlerOptions<Data>,
) {
  return async function handleAdminReportResourceRequest(
    request: Request,
    environment: NodeJS.ProcessEnv = process.env,
    dependencies: AdminReportDependencies = {},
  ) {
    let identity;
    try {
      identity = await authenticateAdminRequest(request, { environment });
    } catch (error) {
      if (error instanceof AdminAuthorizationError) {
        return json(
          { error: { code: "FORBIDDEN", message: error.message } },
          403,
        );
      }
      return json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication is required.",
          },
        },
        401,
      );
    }

    try {
      if (request.method === "GET") {
        if (options.readSnapshot) {
          const snapshot = await options.readSnapshot(environment);
          return json({ data: snapshot.data }, 200, { "x-report-revision": snapshot.revision });
        }
        return json({ data: await options.read(environment) });
      }
      if (request.method !== "PUT") {
        return json(
          {
            error: {
              code: "METHOD_NOT_ALLOWED",
              message: "Only GET and PUT are supported.",
            },
          },
          405,
          { allow: "GET, PUT" },
        );
      }

      const revision = request.headers.get("x-report-revision");
      if (options.writeSnapshot && (!revision || (revision !== "missing" && !/^"[^"\r\n]{1,128}"$/u.test(revision)))) {
        return json({ error: { code: "REPORT_REVISION_REQUIRED", message: "Reload the report before saving changes." } }, 428);
      }
      let payload: unknown;
      try {
        payload = await readLimitedJson(request, 3 * 1024 * 1024);
      } catch (error) {
        if (error instanceof RequestBodyTooLargeError) {
          return json({ error: { code: "PAYLOAD_TOO_LARGE", message: "The report is too large to save." } }, 413);
        }
        if (error instanceof InvalidJsonBodyError) {
          return json({ error: { code: "INVALID_REQUEST", message: "The request body must be valid JSON." } }, 400);
        }
        throw error;
      }
      const parsed = options.schema.safeParse(payload);
      if (!parsed.success) {
        return json(
          {
            error: {
              code: "INVALID_REQUEST",
              message: options.invalidRequestMessage,
            },
          },
          400,
        );
      }

      await (dependencies.audit ?? recordAuditEvent)(
        {
          action: options.auditAction,
          actor: identity,
          target: options.auditTarget,
          outcome: "attempted",
        },
        environment,
      );

      if (options.writeSnapshot && revision) {
        const snapshot = await options.writeSnapshot(parsed.data, environment, revision);
        return json({ data: snapshot.data }, 200, { "x-report-revision": snapshot.revision });
      }
      return json({ data: await options.write(parsed.data, environment) });
    } catch (error) {
      if (isR2PreconditionFailed(error)) return json({ error: { code: "REPORT_CONFLICT", message: "Another administrator saved this report. Your changes are still in the editor. Reload and reconcile the latest report before saving." } }, 409);
      return json(
        {
          error: {
            code: options.unavailableCode,
            message: options.unavailableMessage,
          },
        },
        503,
      );
    }
  };
}
