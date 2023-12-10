import * as express from "express";
import { ZodError, z } from "zod";
import { ZodOpenApiOperationObject } from "zod-openapi";

type RequestConfig<
  ParamsSchema extends z.AnyZodObject = z.AnyZodObject,
  BodySchema extends z.AnyZodObject = z.AnyZodObject,
  QuerySchema extends z.AnyZodObject = z.AnyZodObject
> = {
  path?: ParamsSchema;
  body?: BodySchema;
  query?: QuerySchema;
};

type EndpointRequest<TRequestConfig extends RequestConfig = RequestConfig> = {
  [K in keyof TRequestConfig as undefined extends TRequestConfig[K]
    ? never
    : K]: TRequestConfig[K] extends z.ZodTypeAny
    ? z.output<TRequestConfig[K]>
    : never;
};

type HttpStatusCode =
  | 100
  | 101
  | 102
  | 103
  | SuccessHttpStatusCode
  | 300
  | 301
  | 302
  | 303
  | 304
  | 305
  | 307
  | 308
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 407
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 418
  | 421
  | 422
  | 423
  | 424
  | 425
  | 426
  | 428
  | 429
  | 431
  | 451
  | 500
  | 501
  | 502
  | 503
  | 504
  | 505
  | 506
  | 507
  | 508
  | 510
  | 511;

type SuccessHttpStatusCode =
  | 200
  | 201
  | 202
  | 203
  | 204
  | 205
  | 206
  | 207
  | 208
  | 226;

type ResponseConfig = {
  [K in HttpStatusCode]?: z.ZodString | z.AnyZodObject;
};

type InferResponseType<TResponseConfig, THttpStatusCode> =
  unknown extends TResponseConfig
    ? void
    : THttpStatusCode extends HttpStatusCode
    ? TResponseConfig extends ResponseConfig
      ? TResponseConfig[THttpStatusCode] extends z.ZodTypeAny
        ? {
            statusCode: THttpStatusCode;
            data: z.input<TResponseConfig[THttpStatusCode]>;
          }
        : never
      : never
    : never;

type N = InferResponseType<undefined, 200>;

interface EndpointConfig<
  TRequestConfig extends RequestConfig = RequestConfig,
  TResponseConfig extends ResponseConfig | unknown = unknown
> extends Pick<ZodOpenApiOperationObject, "tags" | "summary" | "description"> {
  request?: TRequestConfig;
  response?: TResponseConfig;
  handler: (
    request: EndpointRequest<TRequestConfig>
  ) => Promise<InferResponseType<TResponseConfig, SuccessHttpStatusCode>>;
}

export function endpoint<
  TRequestConfig extends RequestConfig = RequestConfig,
  TResponseConfig extends ResponseConfig | unknown = unknown
>(config: EndpointConfig<TRequestConfig, TResponseConfig>) {
  function handler(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const validatedRequest = {} as any;
    if (config.request) {
      const pathValidationResult = config.request.path?.safeParse(req.params);
      const bodyValidationResult = config.request.body?.safeParse(req.body);
      const queryValidationResult = config.request.query?.safeParse(req.params);

      const issues: z.ZodIssue[] = [];
      if (pathValidationResult) {
        if (pathValidationResult.success) {
          validatedRequest.path = pathValidationResult.data;
        } else {
          issues.push(...pathValidationResult.error.issues);
        }
      }
      if (bodyValidationResult) {
        if (bodyValidationResult.success) {
          validatedRequest.body = bodyValidationResult.data as any;
        } else {
          issues.push(...bodyValidationResult.error.issues);
        }
      }
      if (queryValidationResult) {
        if (queryValidationResult.success) {
          validatedRequest.query = queryValidationResult.data as any;
        } else {
          issues.push(...queryValidationResult.error.issues);
        }
      }

      if (issues.length > 0) {
        const error = new ZodError(issues);
        res.status(400).send(error);
        return;
      }
    }

    config
      .handler(validatedRequest)
      .then((result) => {
        if (result) {
          res.status(result.statusCode).send(result.data);
        } else {
          res.status(204).send();
        }
      })
      .catch((error) => next(error));
  }

  handler.config = config;

  return handler;
}

export function e<Errors = Error>(): Errors {
  return null as unknown as Errors;
}
