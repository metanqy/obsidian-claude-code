import esbuild from "esbuild";
import { readFileSync } from "fs";
import { resolve } from "path";

const isProduction = process.argv.includes("--production");
const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "manifest.json"), "utf-8")
);

const banner = `/*\n${manifest.name} v${manifest.version}\n*/`;

const ctx = await esbuild.context({
  banner: {
    js: banner,
  },
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  logLevel: "info",
  sourcemap: !isProduction,
  target: "es2018",
  treeShaking: true,
  outfile: "main.js",
});

if (isProduction) {
  await ctx.rebuild();
  await ctx.dispose();
} else {
  await ctx.watch();
}
