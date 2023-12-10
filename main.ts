import assert from "assert";
import express, { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";
import {
  ZodOpenApiObject,
  ZodOpenApiOperationObject,
  createDocument,
  extendZodWithOpenApi,
} from "zod-openapi";
import { endpoint } from "./src/api/endpoint";

extendZodWithOpenApi(z);

function toOpenApi(router: Router) {
  const zodOpenApiObject: ZodOpenApiObject = {
    openapi: "3.1.0",
    info: {
      title: "My API",
      version: "1.0.0",
    },
    paths: {},
  };

  const paths = zodOpenApiObject.paths;
  assert(paths);

  for (const layer of router.stack) {
    if (!isRouteLayer(layer)) {
      continue;
    }
    const path = toOpenApiPath(layer.route.path);

    paths[path] ??= {};

    for (const routeLayer of layer.route.stack) {
      if (!isEndpointLayer(routeLayer)) {
        continue;
      }

      const endpointConfig = routeLayer.handle.config;
      const operation: ZodOpenApiOperationObject = (paths[path][
        routeLayer.method
      ] = {
        responses: {},
        tags: endpointConfig.tags,
        summary: endpointConfig.summary,
        description: endpointConfig.description,
      });
      const requestConfig = endpointConfig.request;
      if (requestConfig?.path) {
        operation.requestParams ??= {};
        operation.requestParams.path = requestConfig.path;
      }
      if (requestConfig?.query) {
        operation.requestParams ??= {};
        operation.requestParams.query = requestConfig.query;
      }
      if (requestConfig?.body) {
        operation.requestBody = {
          content: {
            "application/json": {
              schema: requestConfig.body,
            },
          },
        };
      }
      const responseConfig = endpointConfig.response;
      if (responseConfig) {
        for (const statusCode in responseConfig) {
          const statusCodeStr = statusCode as `${1 | 2 | 3 | 4 | 5}${string}`;
          operation.responses[statusCodeStr] = {
            description: statusCodeStr,
            content: {
              "application/json": {
                schema: (responseConfig as any)[statusCode],
              },
            },
          };
        }
      } else {
        operation.responses["204"] = {
          description: "No Content",
        };
      }
    }
  }

  const openApiDocument = createDocument(zodOpenApiObject);
  return openApiDocument;
}

interface RouteLayer {
  name: "bound dispatch";
  regexp: RegExp;
  route: Route;
}
interface EndpointLayer {
  handle: ReturnType<typeof endpoint>;
  method: Method;
  name: "handler";
}
interface Route {
  methods: Partial<Record<Method, boolean>>;
  path: string;
  stack: any[];
}
type Method = "get" | "post" | "put" | "delete" | "patch" | "options" | "head";
function isRouteLayer(layer: any): layer is RouteLayer {
  return layer.name === "bound dispatch" && layer.route;
}
function isEndpointLayer(layer: any): layer is EndpointLayer {
  return (
    layer.name === "handler" &&
    typeof layer.handle === "function" &&
    typeof layer.handle.config === "object"
  );
}

function toOpenApiPath(expressPath: string) {
  // Regular expression to match Express-style parameters
  const paramRegex = /:[^/]+/g;

  // Replace Express-style parameters with OpenAPI-style parameters
  const openAPIPath = expressPath.replace(
    paramRegex,
    (match) => `{${match.substring(1)}}`
  );

  return openAPIPath;
}

const User = z
  .object({
    name: z.string(),
  })
  .openapi({
    ref: "User",
  });
type User = z.infer<typeof User>;

const users: User[] = [{ name: "Sample" }];

const app = express();
app.use(express.json());

declare global {
  namespace Express {
    interface Request {
      user: string;
    }
  }
}
app.use("/users", (req, _, next) => {
  req.user = "kkkkkkkkkkk";
  next();
});

app.get(
  "/users",
  endpoint({
    tags: ["Users"],
    summary: "Get all users",
    response: {
      200: z
        .object({
          users: z.array(User),
        })
        .openapi({
          ref: "GetUsersResponse",
        }),
    },
    async handler() {
      return {
        statusCode: 200,
        data: {
          users,
        },
      };
    },
  })
);
app.post(
  "/users",
  endpoint({
    tags: ["Users"],
    summary: "Create user",
    request: {
      body: User,
    },
    async handler({ body: user }) {
      users.push(user);
    },
  })
);
app.get(
  "/users/:name",
  endpoint({
    tags: ["Users"],
    summary: "Get user by name",
    request: {
      path: z.object({
        name: z.string(),
      }),
    },
    response: {
      200: z
        .object({
          user: User,
        })
        .openapi({
          ref: "GetUserByNameResponse",
        }),
    },
    async handler({ path: { name } }) {
      const user = users.find((u) => u.name === name);
      if (user == null) {
        throw new Error("User Not Found");
      }
      return {
        statusCode: 200,
        data: { user },
      };
    },
  })
);
const openApiDoc = toOpenApi(app._router);

const options = {
  swaggerOptions: {
    url: "/api-docs/swagger.json",
  },
};
app.get("/api-docs/swagger.json", (req, res) => res.json(openApiDoc));
app.use(
  "/api-docs",
  swaggerUi.serveFiles(undefined, options),
  swaggerUi.setup(undefined, options)
);

app.listen(3000, function () {
  console.log("Server running on http://localhost:3000");
});
