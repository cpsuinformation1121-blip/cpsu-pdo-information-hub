import { resourceQuerySchema } from '../../src/contracts/resource.ts'
import { repositoryCategoryById } from '../../src/config/repository.ts'
import {
  InvalidResourceCursorError,
  listResources,
  type ListResourcesDependencies,
} from '../repository/listResources.ts'
import type {
  AdminResourceListResponse,
  PublicResourceListResponse,
  ResourceQuery,
} from '../../src/contracts/resource.ts'

const jsonHeaders: Record<string, string> = {
  'cache-control': 'public, max-age=0, s-maxage=60',
  'content-type': 'application/json; charset=utf-8',
}

function jsonResponse(body: unknown, status = 200, headers = jsonHeaders) {
  return new Response(JSON.stringify(body), { status, headers })
}

export async function handleResourcesRequest(
  request: Request,
  dependencies: ListResourcesDependencies = {},
  resourceLister: (
    query: ResourceQuery,
    dependencies?: ListResourcesDependencies,
  ) => Promise<PublicResourceListResponse | AdminResourceListResponse> = listResources,
): Promise<Response> {
  if (request.method !== 'GET') {
    return jsonResponse(
      { error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET is supported.' } },
      405,
      { ...jsonHeaders, allow: 'GET' },
    )
  }

  const url = new URL(request.url)
  const queryResult = resourceQuerySchema.safeParse(Object.fromEntries(url.searchParams))

  if (!queryResult.success) {
    return jsonResponse(
      {
        error: {
          code: 'INVALID_QUERY',
          message: 'One or more query parameters are invalid.',
          details: queryResult.error.issues.map((issue) => ({
            field: issue.path.join('.') || 'query',
            message: issue.message,
          })),
        },
      },
      400,
    )
  }

  const requestedCategory = queryResult.data.category
    ? repositoryCategoryById.get(queryResult.data.category)
    : undefined

  if (queryResult.data.category && !requestedCategory) {
    return jsonResponse(
      {
        error: {
          code: 'INVALID_CATEGORY',
          message: 'The requested repository category is not configured.',
        },
      },
      400,
    )
  }

  if (
    queryResult.data.section &&
    requestedCategory &&
    requestedCategory.sectionId !== queryResult.data.section
  ) {
    return jsonResponse(
      {
        error: {
          code: 'INVALID_CATEGORY',
          message: 'The requested category does not belong to the selected section.',
        },
      },
      400,
    )
  }

  try {
    return jsonResponse(await resourceLister(queryResult.data, dependencies))
  } catch (error) {
    if (error instanceof InvalidResourceCursorError) {
      return jsonResponse(
        {
          error: {
            code: 'INVALID_CURSOR',
            message: 'The repository pagination cursor is invalid.',
          },
        },
        400,
      )
    }

    return jsonResponse(
      {
        error: {
          code: 'REPOSITORY_UNAVAILABLE',
          message: 'The repository is temporarily unavailable. Please try again later.',
        },
      },
      503,
      { ...jsonHeaders, 'cache-control': 'no-store' },
    )
  }
}
