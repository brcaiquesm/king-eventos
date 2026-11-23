// Lê a agenda do Google (formato iCal) e devolve só os dias já reservados.
// O endereço secreto fica na variável de ambiente GOOGLE_CALENDAR_ICS_URL (Vercel).
// Nada do que o visitante manda (parâmetros, corpo, cabeçalhos) é usado aqui.

const FUSO = "America/Sao_Paulo";
const CACHE_MS = 5 * 60 * 1000;   // consulta o Google no máximo a cada 5 min por instância
const LIMITE_ICS = 2_000_000;      // ignora respostas gigantes (2 MB)
let memoria = { quando: 0, dias: null };

function desdobrar(ics) {
  return ics.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

function dataLocal(valor, params) {
  if (/^\d{8}$/.test(valor) || /VALUE=DATE(?!-)/.test(params)) {
    const v = valor.slice(0, 8);
    return { y: +v.slice(0, 4), m: +v.slice(4, 6), d: +v.slice(6, 8), diaInteiro: true };
  }
  const m = valor.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return null;
  if (m[7] !== "Z") return { y: +m[1], m: +m[2], d: +m[3], diaInteiro: false };
  const dt = new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(dt).split("-");
  return { y: +p[0], m: +p[1], d: +p[2], diaInteiro: false };
}

const chave = (x) => `${x.y}-${String(x.m).padStart(2, "0")}-${String(x.d).padStart(2, "0")}`;

export function diasOcupados(ics, hoje = new Date()) {
  const dias = new Set();
  let ev = null;
  for (const linha of desdobrar(ics)) {
    if (linha === "BEGIN:VEVENT") { ev = {}; continue; }
    if (linha === "END:VEVENT") {
      // Conta qualquer evento da agenda, menos os cancelados
      if (ev && ev.ini && ev.status !== "CANCELLED") {
        const ini = new Date(Date.UTC(ev.ini.y, ev.ini.m - 1, ev.ini.d));
        let fim = ev.fim ? new Date(Date.UTC(ev.fim.y, ev.fim.m - 1, ev.fim.d)) : new Date(ini);
        if (ev.fim && ev.fim.diaInteiro && fim > ini) fim = new Date(fim.getTime() - 864e5);
        for (let t = ini; t <= fim && dias.size < 2000; t = new Date(t.getTime() + 864e5)) {
          dias.add(chave({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }));
        }
      }
      ev = null; continue;
    }
    if (!ev) continue;
    const i = linha.indexOf(":"); if (i < 0) continue;
    const [nome, ...params] = linha.slice(0, i).split(";");
    const valor = linha.slice(i + 1).trim();
    if (nome === "DTSTART") ev.ini = dataLocal(valor, params.join(";"));
    else if (nome === "DTEND") ev.fim = dataLocal(valor, params.join(";"));
    else if (nome === "STATUS") ev.status = valor;
  }
  const hojeK = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(hoje);
  return [...dias].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= hojeK).sort();
}

async function buscarDias(url) {
  if (memoria.dias && Date.now() - memoria.quando < CACHE_MS) return memoria.dias;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, { headers: { "User-Agent": "king-eventos-site" }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`agenda ${r.status}`);
    const ics = await r.text();
    if (ics.length > LIMITE_ICS) throw new Error("agenda grande demais");
    memoria = { quando: Date.now(), dias: diasOcupados(ics) };
    return memoria.dias;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).send(JSON.stringify({ dias: [] }));
    return;
  }
  const url = process.env.GOOGLE_CALENDAR_ICS_URL;
  if (!url) {
    res.status(200).send(JSON.stringify({ dias: [] }));
    return;
  }
  try {
    const dias = await buscarDias(url);
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.status(200).send(JSON.stringify({ dias }));
  } catch (e) {
    // Detalhe do erro fica só no log da Vercel, nunca na resposta
    console.error("Falha ao ler a agenda:", e && e.message);
    if (memoria.dias) {
      res.setHeader("Cache-Control", "public, s-maxage=60");
      res.status(200).send(JSON.stringify({ dias: memoria.dias }));
      return;
    }
    res.setHeader("Cache-Control", "public, s-maxage=60");
    res.status(200).send(JSON.stringify({ dias: [] }));
  }
}
