import type { Connect } from "vite";

import {
  ALCYONE_FONT_METHOD_NOT_ALLOWED_HEADERS,
  ALCYONE_FONT_METHOD_NOT_ALLOWED_STATUS,
  ALCYONE_FONT_UNAVAILABLE_HEADERS,
  getAlcyoneFontUnavailableStatus,
  isAlcyoneFontEndpoint,
  isAlcyoneFontRequestMethod,
} from "./src/lib/alcyone-font-protocol.js";

export function createLocalFontBoundaryMiddleware(): Connect.NextHandleFunction {
  return (request, response, next) => {
    if (!isAlcyoneFontEndpoint(request.url)) {
      next();
      return;
    }

    const method = request.method ?? "";
    const isAllowedMethod = isAlcyoneFontRequestMethod(method);
    const headers = isAllowedMethod
      ? ALCYONE_FONT_UNAVAILABLE_HEADERS
      : ALCYONE_FONT_METHOD_NOT_ALLOWED_HEADERS;

    for (const [header, value] of Object.entries(headers)) {
      response.setHeader(header, value);
    }
    response.statusCode = isAllowedMethod
      ? getAlcyoneFontUnavailableStatus(method)
      : ALCYONE_FONT_METHOD_NOT_ALLOWED_STATUS;
    response.end();
  };
}
