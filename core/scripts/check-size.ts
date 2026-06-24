// deno-lint-ignore-file no-import-prefix
import { ensureDirSync } from "jsr:@std/fs@1";
import { basename, extname } from "jsr:@std/path@1";

function formatSize(size: number, decimals = 2): string {
  if (size < 1024) return `${size}B`;
  const power = 10 ** decimals;
  return `${Math.round((size / 1024) * power) / power}KB`;
}

ensureDirSync("dist");

const entries = ["create-store.ts", "with-plugins.ts", "derive.ts"];

for (const entry of entries) {
  const name = basename(entry, extname(entry));
  console.log(`Processing ${entry}...`);

  const bundle = `dist/${name}.bundle.js`;
  const minified = `dist/${name}.min.js`;

  // Bundle with Deno.

  const bundleResult = new Deno.Command("deno", {
    args: ["bundle", entry, "-o", bundle],
  }).outputSync();

  if (!bundleResult.success) {
    console.error(new TextDecoder().decode(bundleResult.stderr));
    Deno.exit(1);
  }

  // Minify with esbuild.

  const esbuildResult = new Deno.Command("npx", {
    args: ["esbuild", bundle, "--minify", `--outfile=${minified}`],
  }).outputSync();

  if (!esbuildResult.success) {
    console.error(new TextDecoder().decode(esbuildResult.stderr));
    Deno.exit(1);
  }

  // Gzip and report size.

  const data = Deno.readFileSync(minified);
  const gzipped = new Uint8Array(
    await new Response(
      new Blob([data]).stream().pipeThrough(new CompressionStream("gzip")),
    ).arrayBuffer(),
  );
  Deno.writeFileSync(`${minified}.gz`, gzipped);

  console.log(`${minified}.gz size: ${formatSize(gzipped.length)}`);
  console.log("");
}
