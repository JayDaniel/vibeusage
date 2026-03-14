#!/usr/bin/env node
/**
 * 为每个 supabase-functions/*.js（ESM bundle）生成 supabase/functions/<name>/index.ts
 *
 * 处理：
 * 1. 去掉 export default，用 Deno.serve 包装
 * 2. 将 __require("https://esm.sh/@supabase/supabase-js@2") 替换为顶层 ESM import
 * 3. 将 __require 的 polyfill shim 替换为能在 Deno 中工作的版本
 *
 * Created by Skyler Liu on 2026-03-14
 */
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

async function main() {
  const rootDir = path.resolve(__dirname, "..");
  const srcDir = path.join(rootDir, "supabase-functions");
  const outDir = path.join(rootDir, "supabase", "functions");

  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  const jsFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith(".js"))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (jsFiles.length === 0) {
    console.error("No .js files found in supabase-functions/");
    process.exitCode = 1;
    return;
  }

  let count = 0;
  for (const entry of jsFiles) {
    const name = entry.name.replace(/\.js$/, "");
    const funcDir = path.join(outDir, name);
    await fs.mkdir(funcDir, { recursive: true });

    let bundleContent = await fs.readFile(
      path.join(srcDir, entry.name),
      "utf8"
    );

    // 检测是否有 esm.sh 的外部 import
    const hasSupabaseImport = bundleContent.includes(
      'https://esm.sh/@supabase/supabase-js@2'
    );

    let imports = "";
    if (hasSupabaseImport) {
      // 添加顶层 ESM import
      imports = `import { createClient as __supabase_createClient__ } from "https://esm.sh/@supabase/supabase-js@2";\n`;

      // 替换 __require("https://esm.sh/@supabase/supabase-js@2") 为使用顶层 import 的值
      // 原始代码如：var { createClient } = __require("https://esm.sh/@supabase/supabase-js@2");
      // 替换为：var { createClient } = { createClient: __supabase_createClient__ };
      bundleContent = bundleContent.replace(
        /__require\("https:\/\/esm\.sh\/@supabase\/supabase-js@2"\)/g,
        "{ createClient: __supabase_createClient__ }"
      );
    }

    // 移除 esbuild 生成的 __require polyfill（在 Deno 中不需要，且会出错）
    // 匹配从 "var __require = /* @__PURE__ */" 到下一个 "});\n" 的完整多行代码块
    bundleContent = bundleContent.replace(
      /var __require = \/\* @__PURE__ \*\/[\s\S]*?\}\);\n/,
      "// __require polyfill removed for Deno compatibility\n"
    );

    // 去掉 export default 并用 Deno.serve 包装
    const lastExportMatch = bundleContent.match(
      /^export default (.+);?\s*$/m
    );
    let finalContent;
    if (lastExportMatch) {
      const exportExpr = lastExportMatch[1].replace(/;$/, "");
      const contentWithoutExport = bundleContent.replace(
        /^export default .+;?\s*$/m,
        ""
      );
      // 使用诊断包装：捕获 bundle 初始化和运行时异常
      finalContent = `// Auto-generated Deno Edge Function entry
// Source: supabase-functions/${entry.name}
// @ts-nocheck

${imports}
const __corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};
let __bundleError: string | null = null;
let __handler: ((req: Request) => Response | Promise<Response>) | null = null;

try {
${contentWithoutExport}
__handler = ${exportExpr};
} catch (e: any) {
  __bundleError = String(e?.stack || e);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: __corsHeaders });
  }
  if (__bundleError) {
    return new Response(JSON.stringify({ error: "Bundle init failed", details: __bundleError }), {
      status: 500, headers: { ...__corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!__handler || typeof __handler !== "function") {
    return new Response(JSON.stringify({ error: "Handler not found", type: typeof __handler }), {
      status: 500, headers: { ...__corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    return await __handler(req);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "Handler error", details: String(e?.stack || e) }), {
      status: 500, headers: { ...__corsHeaders, "Content-Type": "application/json" },
    });
  }
});
`;
    } else {
      // fallback
      finalContent = `// Auto-generated Deno Edge Function entry
// Source: supabase-functions/${entry.name}
// @ts-nocheck

${imports}
const module = { exports: {} };
const exports = module.exports;
${bundleContent}
Deno.serve(module.exports);
`;
    }

    await fs.writeFile(path.join(funcDir, "index.ts"), finalContent);
    count++;
    console.log(`[${count}/${jsFiles.length}] Generated ${name}/index.ts`);
  }

  console.log(
    `\nDone. Generated ${count} function wrappers in supabase/functions/`
  );
}

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exitCode = 1;
});
