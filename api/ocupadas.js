// Lê a agenda do Google (formato iCal) e devolve os dias já reservados.
// Configure na Vercel a variável de ambiente GOOGLE_CALENDAR_ICS_URL
// com o "Endereço secreto no formato iCal" da agenda de reservas.

const FUSO = "America/Sao_Paulo";

function desdobrar(ics) {
  // linhas longas do iCal continuam na linha seguinte começando com espaço
  return ics.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

function dataLocal(valor, params) {
  // DATE (dia inteiro): 20261224
  if (/^\d{8}$/.test(valor) || /VALUE=DATE(?!-)/.test(params)) {
    const v = valor.slice(0, 8);
    return { y: +v.slice(0, 4), m: +v.slice(4, 6), d: +v.slice(6, 8), diaInteiro: true };
  }
  // DATE-TIME: 20261224T180000Z ou com TZID
  const m = valor.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return null;
  let dt;
  if (m[7] === "Z") dt = new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  else return { y: +m[1], m: +m[2], d: +m[3], diaInteiro: false }; // horário local da agenda
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
      if (ev && ev.ini && ev.status !== "CANCELLED" && ev.transp !== "TRANSPARENT") {
        const ini = new Date(Date.UTC(ev.ini.y, ev.ini.m - 1, ev.ini.d));
        let fim = ev.fim ? new Date(Date.UTC(ev.fim.y, ev.fim.m - 1, ev.fim.d)) : new Date(ini);
        // em evento de dia inteiro o fim é exclusivo (dia seguinte)
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
    else if (nome === "TRANSP") ev.transp = valor;
  }
  const hojeK = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(hoje);
  return [...dias].filter((d) => d >= hojeK).sort();
}

export default async function handler(req, res) {
  const url = process.env.GOOGLE_CALENDAR_ICS_URL;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (!url) {
    res.status(200).send(JSON.stringify({ dias: [], aviso: "GOOGLE_CALENDAR_ICS_URL não configurada" }));
    return;
  }
  try {
    const r = await fetch(url, { headers: { "User-Agent": "king-eventos-site" } });
    if (!r.ok) throw new Error(`Agenda respondeu ${r.status}`);
    const dias = diasOcupados(await r.text());
    // guarda por 5 minutos na Vercel: mudanças na agenda aparecem em até ~5 min
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.status(200).send(JSON.stringify({ dias }));
  } catch (e) {
    res.setHeader("Cache-Control", "public, s-maxage=60");
    res.status(200).send(JSON.stringify({ dias: [], erro: String(e.message || e) }));
  }
}
