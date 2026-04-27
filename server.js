import express from "express";
import { createServerAdapter } from "@whatwg-node/server";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Serve static assets from the client build
app.use(express.static(path.join(__dirname, "dist/client"), { index: false }));

// Load the server entry dynamically
import("./dist/server/server.js")
  .then((module) => {
    // TanStack Start server entry exports a `createServerEntry` function
    // or a default fetch handler.
    const fetchHandler = module.default?.fetch || module.createServerEntry?.({ fetch: globalThis.fetch })?.fetch;
    
    if (fetchHandler) {
      app.use(
        createServerAdapter(async (request) => {
          return fetchHandler(request);
        })
      );
      app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
      });
    } else {
      console.error("Could not find a fetch handler in dist/server/server.js");
    }
  })
  .catch((err) => {
    console.error("Failed to load server entry:", err);
  });
