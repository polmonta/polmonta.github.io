import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
);
const vite = await createServer({
    root: projectRoot,
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true },
});

try {
    const { ContainerScroll } = await vite.ssrLoadModule(
        "/src/components/ui/container-scroll-animation.jsx",
    );
    const markup = renderToStaticMarkup(
        React.createElement(
            ContainerScroll,
            {
                titleComponent: React.createElement("span", null, "Title"),
            },
            React.createElement("p", null, "Content"),
        ),
    );

    assert.match(markup, /Title/);
    assert.match(markup, /Content/);
    console.log("container-scroll-animation SSR render passed");
} finally {
    await vite.close();
}
