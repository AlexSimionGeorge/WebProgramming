import type { ErrorRequestHandler, RequestHandler } from "express";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function errorBody(code: string, message: string) {
  return { error: { code, message } };
}

function isMalformedJson(error: unknown): boolean {
  return error instanceof SyntaxError && "body" in error;
}

export const unknownRouteHandler: RequestHandler = (request, response) => {
  response
    .status(404)
    .json(errorBody("NOT_FOUND", `No route for ${request.method} ${request.path}`));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) {
    response.status(error.status).json(errorBody(error.code, error.message));
    return;
  }
  if (isMalformedJson(error)) {
    response.status(400).json(errorBody("INVALID_JSON", "The request body is not valid JSON"));
    return;
  }
  console.error(error);
  response.status(500).json(errorBody("INTERNAL_ERROR", "Something went wrong on our side"));
};
