import copyRaw from "../content/copy.csv?raw";

const REQUIRED_COLUMNS = ["key", "module", "page", "component", "slot", "text"];

let cachedRegistry = null;

function parseCsv(raw) {
  const rows = [];
  let row = [];
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

    if (ch === ',') {
      row.push(field);
      field = "";
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      field = "";
      if (!row.every((cell) => cell.trim() === "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    if (ch === '\r') {
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

function buildRegistry(raw) {
  const rows = parseCsv(raw || "");
  if (!rows.length) return { map: new Map(), rows: [] };

  const header = rows[0].map((cell) => cell.trim());
  const missing = REQUIRED_COLUMNS.filter((col) => !header.includes(col));
  if (missing.length) {
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.error("Copy registry missing columns:", missing.join(", "));
    }
    return { map: new Map(), rows: [] };
  }

  const idx = Object.fromEntries(header.map((col, index) => [col, index]));
  const entries = [];
  const map = new Map();

  rows.slice(1).forEach((cells, rowIndex) => {
    const record = {
      key: String(cells[idx.key] || "").trim(),
      module: String(cells[idx.module] || "").trim(),
      page: String(cells[idx.page] || "").trim(),
      component: String(cells[idx.component] || "").trim(),
      slot: String(cells[idx.slot] || "").trim(),
      text: String(cells[idx.text] ?? "").trim(),
    };

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

function interpolate(text, params) {
  if (!params) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (params[key] == null) return match;
    return String(params[key]);
  });
}

function normalizeText(text) {
  return String(text).replace(/\\n/g, "\n");
}

export function copy(key, params) {
  const registry = getRegistry();
  const record = registry.map.get(key);
  const value = record?.text || key;

  if (!record && import.meta?.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`Missing copy key: ${key}`);
  }

  const normalized = normalizeText(value);
  return interpolate(normalized, params);
}

export function getCopyRegistry() {
  return getRegistry();
}
