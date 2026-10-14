import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

function serviceWorker(): Plugin {
  return {
    name: "service-worker",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const hash = createHash("sha256");
      const files = Object.values(bundle).map((file) => {
        hash.update(file.fileName);
        hash.update(file.type === "chunk" ? file.code : file.source);
        return file.fileName;
      });
      const publicFiles = readdirSync("public");
      for (const name of publicFiles) hash.update(readFileSync(`public/${name}`));
      const assets = ["./", ...[...files, ...publicFiles].map((f) => `./${f}`)];
      const source = readFileSync("sw.js", "utf8")
        .replace("__VERSION__", hash.digest("hex").slice(0, 12))
        .replace("__ASSETS__", JSON.stringify(assets));
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/habits/" : "/",
  server: { port: 5173, strictPort: true },
  plugins: [serviceWorker()],
}));
