import { Router } from "express";
import { openApiDocument } from "./openApiDocument.js";

/** Swagger UI is loaded from a CDN, so the docs add no dependency to the backend. */
const swaggerUiVersion = "5.35.1";
const swaggerUiAssets = `https://unpkg.com/swagger-ui-dist@${swaggerUiVersion}`;

const swaggerPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Padel Booking API</title>
    <link rel="stylesheet" href="${swaggerUiAssets}/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${swaggerUiAssets}/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/docs/openapi.json",
        dom_id: "#swagger-ui",
        persistAuthorization: true,
        tryItOutEnabled: true,
        displayRequestDuration: true,
      });
    </script>
  </body>
</html>
`;

export const docsRouter = Router();

docsRouter.get("/", (_request, response) => {
  response.type("html").send(swaggerPage);
});

docsRouter.get("/openapi.json", (_request, response) => {
  response.json(openApiDocument);
});
