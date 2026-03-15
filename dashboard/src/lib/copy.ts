import copyRaw from "../content/copy.csv?raw";

const REQUIRED_COLUMNS = ["key", "module", "page", "component", "slot", "text"];
const SUPPORTED_LOCALES = ["en", "zh"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
type AnyRecord = Record<string, any>;

let currentLocale: Locale = "en";
let cachedRegistry: any = null;

/// 获取当前语言标识
function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem("vibeusage.locale");
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch (_e) {
    // ignore storage errors
  }
  // 自动检测浏览器语言
  const browserLang = navigator.language || (navigator as any).userLanguage || "";
  if (browserLang.startsWith("zh")) return "zh";
  return "en";
}

currentLocale = detectInitialLocale();

/// 获取当前语言
export function getLocale(): Locale {
  return currentLocale;
}

/// 设置当前语言并持久化到 localStorage
export function setLocale(locale: Locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return;
  currentLocale = locale;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("vibeusage.locale", locale);
    } catch (_e) {
      // ignore storage errors
    }
  }
}

/// 获取支持的语言列表
export function getSupportedLocales() {
  return SUPPORTED_LOCALES;
}

function parseCsv(raw: any) {
  const rows: any[] = [];
  let row: any[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = raw[i + 1];
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (ch === "\n") {
      row.push(field);
      field = "";
      if (!row.every((cell) => cell.trim() === "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    if (ch === "\r") {
      continue;
    }

    field += ch;
  }

  row.push(field);
  if (!row.every((cell) => cell.trim() === "")) {
    rows.push(row);
  }

  return rows;
}

function buildRegistry(raw: any) {
  const rows = parseCsv(raw || "");
  if (!rows.length) return { map: new Map(), rows: [] };

  const header = rows[0].map((cell: any) => String(cell).trim());
  const missing = REQUIRED_COLUMNS.filter((col) => !header.includes(col));
  if (missing.length) {
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.error("Copy registry missing columns:", missing.join(", "));
    }
    return { map: new Map(), rows: [] };
  }

  const idx = Object.fromEntries(header.map((col: any, index: number) => [col, index]));
  const entries: any[] = [];
  const map = new Map();

  rows.slice(1).forEach((cells: any[], rowIndex: number) => {
    const record: any = {
      key: String(cells[idx.key] || "").trim(),
      module: String(cells[idx.module] || "").trim(),
      page: String(cells[idx.page] || "").trim(),
      component: String(cells[idx.component] || "").trim(),
      slot: String(cells[idx.slot] || "").trim(),
      text: String(cells[idx.text] ?? "").trim(),
    };

    // 读取中文翻译列（如果存在）
    if (idx.text_zh != null) {
      record.text_zh = String(cells[idx.text_zh] ?? "").trim();
    }

    if (!record.key) return;

    if (map.has(record.key) && import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`Duplicate copy key: ${record.key} (row ${rowIndex + 2})`);
    }

    map.set(record.key, record);
    entries.push(record);
  });

  return { map, rows: entries };
}

function getRegistry() {
  if (!cachedRegistry) {
    cachedRegistry = buildRegistry(copyRaw);
  }
  return cachedRegistry;
}

function interpolate(text: any, params?: AnyRecord) {
  if (!params) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
    if (params[key] == null) return match;
    return String(params[key]);
  });
}

function normalizeText(text: any) {
  return String(text).replace(/\\n/g, "\n");
}

/// 根据 key 和当前语言设置获取对应文案，并进行参数插值
export function copy(key: any, params?: AnyRecord) {
  const registry = getRegistry();
  const record = registry.map.get(key);

  let value: string;
  if (!record) {
    value = key;
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`Missing copy key: ${key}`);
    }
  } else if (currentLocale === "zh" && record.text_zh) {
    value = record.text_zh;
  } else {
    value = record.text;
  }

  const normalized = normalizeText(value);
  return interpolate(normalized, params);
}

export function getCopyRegistry() {
  return getRegistry();
}
