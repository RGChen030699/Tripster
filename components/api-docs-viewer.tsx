"use client";

import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    SwaggerUIBundle?: (options: {
      url: string;
      dom_id: string;
      deepLinking?: boolean;
      tryItOutEnabled?: boolean;
    }) => void;
  }
}

/** Pinned swagger-ui-dist version loaded from the unpkg CDN in the browser. */
const SWAGGER_UI_VERSION = "5.17.14";

type ApiDocsViewerProps = {
  specUrl: string;
};

export function ApiDocsViewer({ specUrl }: ApiDocsViewerProps) {
  const reactId = useId();
  const domId = `swagger-ui-${reactId.replace(/:/g, "")}`;
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {
      return;
    }
    mounted.current = true;

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css`;
    document.head.appendChild(stylesheet);

    const script = document.createElement("script");
    script.src = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js`;
    script.async = true;
    script.onload = () => {
      window.SwaggerUIBundle?.({
        url: specUrl,
        dom_id: `#${domId}`,
        deepLinking: true,
        tryItOutEnabled: false,
      });
    };
    document.body.appendChild(script);

    return () => {
      stylesheet.remove();
      script.remove();
    };
  }, [domId, specUrl]);

  return <div id={domId} className="api-docs-swagger mt-6 overflow-x-auto rounded-sm bg-white p-2" />;
}
