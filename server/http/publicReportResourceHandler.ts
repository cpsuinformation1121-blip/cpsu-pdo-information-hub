type PublicReportData = {
  entries: Record<string, unknown>;
};

type PublicReportHandlerOptions<Data extends PublicReportData> = {
  read: (environment?: NodeJS.ProcessEnv) => Promise<Data>;
  unavailableCode: string;
  unavailableMessage: string;
};

type PublicReportDependencies<Data extends PublicReportData> = {
  read?: (environment?: NodeJS.ProcessEnv) => Promise<Data>;
};

const publicHeaders = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
};

function json(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...publicHeaders, ...extraHeaders },
  });
}

export function createPublicReportResourceHandler<
  Data extends PublicReportData,
>(options: PublicReportHandlerOptions<Data>) {
  return async function handlePublicReportResourceRequest(
    request: Request,
    environment: NodeJS.ProcessEnv = process.env,
    dependencies: PublicReportDependencies<Data> = {},
  ) {
    if (request.method !== "GET") {
      return json(
        {
          error: {
            code: "METHOD_NOT_ALLOWED",
            message: "Only GET is supported.",
          },
        },
        405,
        { allow: "GET" },
      );
    }

    const year = new URL(request.url).searchParams.get("year");
    if (!year || !/^\d{4}$/u.test(year)) {
      return json(
        {
          error: {
            code: "INVALID_YEAR",
            message: "Select a valid year.",
          },
        },
        400,
      );
    }

    try {
      const data = await (dependencies.read ?? options.read)(environment);
      return json({
        data: {
          ...data,
          entries: { [year]: data.entries[year] ?? {} },
        },
      });
    } catch {
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
