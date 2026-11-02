import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRouteHandler = (request: Request, response: Response) => Promise<void>;

export function asyncRoute(handler: AsyncRouteHandler): RequestHandler {
  return (request: Request, response: Response, next: NextFunction) => {
    handler(request, response).catch(next);
  };
}
