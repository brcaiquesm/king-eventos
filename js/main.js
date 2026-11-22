/* =========================================================
   King Eventos — configuração
   Número do WhatsApp: DDI + DDD + número, só dígitos.
   ========================================================= */
const CONFIG = {
  whatsapp: "5514998140623",
  // Dias reservados: vêm da agenda do Google (veja api/ocupadas.js).
  datasOcupadas: [],
  agendaUrl: "/api/ocupadas",

  // Tabela de preços (valor do espaço por dia)
  precos: {
    semana: { sem: 500, com: 700 },        // segunda a quinta
    fimDeSemana: { sem: 800, com: 1000 },  // sexta, sábado, domingo e feriado
  },
  // Desconto no valor total conforme a quantidade de dias (do maior para o menor)
  descontos: [
    { dias: 3, pct: 30 },
    { dias: 2, pct: 20 },
  ],
  // Semanas com pacote próprio (mês-dia). Valor sob consulta.
  periodosEspeciais: [
    { nome: "semana do Natal", de: "12-21", ate: "12-27" },
    { nome: "semana do Ano Novo", de: "12-28", ate: "01-03" },
  ],
  // Feriados prolongados (calculados sozinhos) também ficam como valor sob consulta.
};

// Links de WhatsApp com mensagem pronta (atributo data-wa)
document.querySelectorAll("[data-wa]").forEach((el) => {
  el.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(el.dataset.wa)}`;
  el.target = "_blank";
  el.rel = "noopener";
});

// Topo e botão flutuante mudam ao rolar
const topo = document.querySelector("[data-topo]");
const waFlut = document.querySelector(".wa-flutuante");
const aoRolar = () => {
  topo.classList.toggle("is-rolado", window.scrollY > 40);
  waFlut.classList.toggle("is-visivel", window.scrollY > window.innerHeight * 0.7);
};
aoRolar();
window.addEventListener("scroll", aoRolar, { passive: true });

// Menu do celular
const btn = document.querySelector("[data-menu-btn]");
const menu = document.querySelector("[data-menu]");
const fecharMenu = () => {
  menu.classList.remove("is-aberto");
  btn.setAttribute("aria-expanded", "false");
  btn.querySelector(".sr").textContent = "Abrir menu";
};
btn.addEventListener("click", () => {
  const aberto = menu.classList.toggle("is-aberto");
  btn.setAttribute("aria-expanded", String(aberto));
  btn.querySelector(".sr").textContent = aberto ? "Fechar menu" : "Abrir menu";
});
menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", fecharMenu));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharMenu(); });

// Vídeo do tour: toca só quando aparece na tela (e não toca se a pessoa pediu menos movimento)
const video = document.querySelector("[data-tour]");
const playBtn = document.querySelector("[data-tour-btn]");
const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let pausadoPeloUsuario = semMovimento;
const atualizarBotao = () => {
  playBtn.classList.toggle("is-pausado", video.paused);
  playBtn.setAttribute("aria-label", video.paused ? "Reproduzir vídeo" : "Pausar vídeo");
};
playBtn.addEventListener("click", () => {
  if (video.paused) { pausadoPeloUsuario = false; video.play(); }
  else { pausadoPeloUsuario = true; video.pause(); }
});
video.addEventListener("play", atualizarBotao);
video.addEventListener("pause", atualizarBotao);
atualizarBotao();
new IntersectionObserver(([entrada]) => {
  if (entrada.isIntersecting && !pausadoPeloUsuario) video.play().catch(() => {});
  else if (!entrada.isIntersecting) video.pause();
}, { threshold: 0.4 }).observe(video);

// Galeria com visualizador
const fotos = [...document.querySelectorAll("[data-galeria] img")];
const visor = document.querySelector("[data-visor]");
const visorImg = document.querySelector("[data-visor-img]");
let atual = 0;
const mostrar = (i) => {
  atual = (i + fotos.length) % fotos.length;
  visorImg.src = fotos[atual].currentSrc || fotos[atual].src;
  visorImg.alt = fotos[atual].alt;
};
fotos.forEach((img, i) => img.parentElement.addEventListener("click", () => { mostrar(i); visor.showModal(); }));
document.querySelector("[data-visor-fechar]").addEventListener("click", () => visor.close());
document.querySelector("[data-visor-ant]").addEventListener("click", () => mostrar(atual - 1));
document.querySelector("[data-visor-prox]").addEventListener("click", () => mostrar(atual + 1));
visor.addEventListener("click", (e) => { if (e.target === visor) visor.close(); });
visor.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") mostrar(atual - 1);
  if (e.key === "ArrowRight") mostrar(atual + 1);
});

// Feriados nacionais e feriados prolongados
const Feriados = (() => {
  const cache = {};
  const pascoa = (y) => { // algoritmo de Meeus/Jones/Butcher
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mes - 1, dia);
  };
  const somar = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const k = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const doAno = (y) => {
    if (cache[y]) return cache[y];
    const p = pascoa(y);
    const lista = [
      [new Date(y, 0, 1), "Ano Novo"], [new Date(y, 3, 21), "Tiradentes"], [new Date(y, 4, 1), "Dia do Trabalho"],
      [new Date(y, 8, 7), "Independência"], [new Date(y, 9, 12), "Nossa Senhora Aparecida"], [new Date(y, 10, 2), "Finados"],
      [new Date(y, 10, 15), "Proclamação da República"], [new Date(y, 10, 20), "Consciência Negra"], [new Date(y, 11, 25), "Natal"],
      [somar(p, -2), "Sexta-feira Santa"], [somar(p, 60), "Corpus Christi"],
    ];
    const feriados = new Map(lista.map(([d, n]) => [k(d), n]));
    const prolongados = new Map();
    const marcar = (de, ate, nome) => { for (let d = de; d <= ate; d = somar(d, 1)) prolongados.set(k(d), nome); };
    marcar(somar(p, -50), somar(p, -46), "feriado de Carnaval");
    for (const [d, n] of lista) {
      const w = d.getDay(), nome = `feriado prolongado (${n})`;
      if (w === 5) marcar(d, somar(d, 2), nome);                 // sexta: sex a dom
      else if (w === 1) marcar(somar(d, -2), d, nome);           // segunda: sáb a seg
      else if (w === 2) marcar(somar(d, -3), d, nome);           // terça: sáb a ter (ponte)
      else if (w === 4) marcar(d, somar(d, 3), nome);            // quinta: qui a dom (ponte)
    }
    return (cache[y] = { feriados, prolongados });
  };
  return {
    feriado: (d) => doAno(d.getFullYear()).feriados.get(k(d)),
    prolongado: (d) => doAno(d.getFullYear()).prolongados.get(k(d)),
  };
})();

// Calendário estilo hotel: um dia ou um período, com valor calculado
{
  const cal = document.querySelector("[data-cal]");
  const $ = (s) => cal.querySelector(s);
  const diasEl = $("[data-cal-dias]"), mesEl = $("[data-cal-mes]"), escolhaEl = $("[data-cal-escolha]");
  const limparBtn = $("[data-cal-limpar]"), legendaEl = $("[data-cal-legenda]"), avisoEl = $("[data-cal-aviso]");
  const antBtn = $("[data-cal-ant]"), proxBtn = $("[data-cal-prox]");
  const valorEl = $("[data-cal-valor]"), quartosEl = $("[data-cal-quartos]"), precoEl = $("[data-cal-preco]");
  const dicaEl = $("[data-cal-dica]"), horarioEl = $("[data-cal-horario]");
  const zap = document.querySelector("[data-cal-btn]");
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const somar = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
  const longa = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const curta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const semana = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });
  const semanaCurta = (d) => semana.format(d).replace("-feira", "");
  const dm = (d) => curta.format(d).slice(0, 5);
  const real = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  let vista = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  let inicio = null, fim = null;

  const linkZap = (msg) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  const dias = (de, ate) => { const l = []; for (let d = de; d <= ate; d = somar(d, 1)) l.push(d); return l; };
  const ocupada = (d) => CONFIG.datasOcupadas.includes(iso(d));

  // Semana do Natal, Ano Novo ou feriado prolongado: valor sob consulta
  const especial = (d) => {
    const md = iso(d).slice(5);
    for (const p of CONFIG.periodosEspeciais) {
      const dentro = p.de <= p.ate ? md >= p.de && md <= p.ate : md >= p.de || md <= p.ate;
      if (dentro) return p.nome;
    }
    return Feriados.prolongado(d) || null;
  };
  const precoDia = (d, comQuartos) => {
    const fds = [0, 5, 6].includes(d.getDay()) || Feriados.feriado(d);
    const t = fds ? CONFIG.precos.fimDeSemana : CONFIG.precos.semana;
    return comQuartos ? t.com : t.sem;
  };
  const pctPara = (n) => (CONFIG.descontos.find((x) => n >= x.dias) || { pct: 0 }).pct;
  const calcular = (de, ate, comQuartos) => {
    const lista = dias(de, ate);
    const esp = lista.map(especial).find(Boolean);
    if (esp) return { n: lista.length, especial: esp };
    const base = lista.reduce((s, d) => s + precoDia(d, comQuartos), 0);
    const pct = pctPara(lista.length);
    return { n: lista.length, base, pct, total: Math.round(base * (1 - pct / 100)) };
  };

  // Sugere o dia seguinte (ou o anterior) para chegar na próxima faixa de desconto
  const sugestao = (r, comQuartos) => {
    const prox = CONFIG.descontos.slice().reverse().find((x) => x.dias > r.n);
    if (!prox || prox.dias - r.n !== 1) return null;
    const ult = fim || inicio;
    for (const [de, ate, extra] of [[inicio, somar(ult, 1), somar(ult, 1)], [somar(inicio, -1), ult, somar(inicio, -1)]]) {
      if (extra < hoje || ocupada(extra) || especial(extra)) continue;
      const nr = calcular(de, ate, comQuartos);
      if (!nr.especial) return { extra, pct: prox.pct, total: nr.total };
    }
    return null;
  };

  const atualizarEscolha = () => {
    limparBtn.hidden = !inicio;
    avisoEl.hidden = !inicio;
    valorEl.hidden = !inicio;
    if (!inicio) {
      escolhaEl.textContent = "Clique em um dia, ou no primeiro e no último dia do período.";
      zap.textContent = "Consultar datas no WhatsApp";
      zap.href = linkZap(zap.dataset.wa);
      return;
    }
    const ate = fim || inicio;
    const comQuartos = quartosEl.checked;
    const r = calcular(inicio, ate, comQuartos);
    const temOcupado = dias(inicio, ate).some(ocupada);

    // Datas escolhidas
    const txtDatas = r.n === 1
      ? `<strong>${dm(inicio)} (${semana.format(inicio)})</strong><br><span>Para um período, clique também no último dia.</span>`
      : `<strong>${dm(inicio)} (${semanaCurta(inicio)}) até ${dm(ate)} (${semanaCurta(ate)})</strong><br><span>${r.n} dias</span>`;
    escolhaEl.innerHTML = txtDatas + (temOcupado ? "<em>Tem dia já reservado nesse período, mas pergunte que a gente vê outras opções.</em>" : "");

    // Valor
    if (r.especial) {
      precoEl.innerHTML = `<p class="cal__total cal__total--consulta">Valor sob consulta</p><p class="cal__obs">Data especial (${r.especial}): tem pacote e valor próprios. Peça o orçamento pelo WhatsApp.</p>`;
    } else {
      precoEl.innerHTML = (r.pct
        ? `<p class="cal__de">De <s>${real(r.base)}</s> por</p><p class="cal__total">${real(r.total)}</p><p class="cal__economia">${r.pct}% de desconto: você economiza ${real(r.base - r.total)}</p>`
        : `<p class="cal__total">${real(r.total)}</p>`) + `<p class="cal__obs">${comQuartos ? "Com os 2 quartos" : "Sem quartos"} · ${r.n === 1 ? "diária" : r.n + " dias"}</p>`;
    }

    // Dica de desconto
    const s = r.especial ? null : sugestao(r, comQuartos);
    dicaEl.hidden = !s;
    if (s) dicaEl.innerHTML = `Adicione mais 1 dia (${semanaCurta(s.extra)}, ${dm(s.extra)}) e ganhe <strong>${s.pct}% de desconto</strong>: o total fica ${real(s.total)}.`;

    // Horário
    horarioEl.innerHTML = r.n === 1
      ? `<strong>Diária avulsa: das 10h às 23h.</strong>${comQuartos ? " Na diária, os quartos servem para as crianças descansarem e guardar pertences." : ""}`
      : `<strong>Entrada às 10h de ${dm(inicio)} e saída até 23h de ${dm(ate)}.</strong> ${comQuartos ? "Com os quartos, vocês podem dormir no local." : "Sem os quartos, vocês podem ficar no espaço, mas sem acesso aos quartos."}`;

    // Mensagem do WhatsApp
    const linhaData = r.n === 1
      ? `📅 Data: ${curta.format(inicio)} (${semana.format(inicio)})`
      : `📅 Datas: ${curta.format(inicio)} (${semana.format(inicio)}) a ${curta.format(ate)} (${semana.format(ate)}), ${r.n} dias`;
    const linhaValor = r.especial
      ? `💰 Valor: sob consulta (${r.especial})`
      : `💰 Valor pelo site: ${real(r.total)}${r.pct ? ` (de ${real(r.base)}, com ${r.pct}% de desconto)` : ""}`;
    const msg = [
      "Olá! Vim pelo site e quero reservar a King Eventos.",
      "",
      linhaData,
      `🛏️ Quartos: ${comQuartos ? "com os 2 quartos" : "sem quartos"}`,
      linhaValor,
      "",
      r.n === 1 ? "Essa data está disponível?" : "Essas datas estão disponíveis?",
    ].join("\n");
    zap.textContent = "Reservar pelo WhatsApp";
    zap.href = linkZap(msg);
  };

  const desenhar = () => {
    const t = nomeMes.format(vista); mesEl.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    antBtn.disabled = vista <= new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const total = new Date(vista.getFullYear(), vista.getMonth() + 1, 0).getDate();
    let html = "<span></span>".repeat(vista.getDay());
    for (let d = 1; d <= total; d++) {
      const data = new Date(vista.getFullYear(), vista.getMonth(), d);
      const occ = ocupada(data);
      const fds = [0, 6].includes(data.getDay());
      const ehInicio = inicio && +data === +inicio, ehFim = fim && +data === +fim;
      const meio = inicio && fim && data > inicio && data < fim;
      const cls = ["cal__dia", fds && "cal__dia--fim", occ && "cal__dia--ocupado", +data === +hoje && "cal__dia--hoje",
        meio && "cal__dia--meio", ehInicio && fim && "cal__dia--ini", ehFim && "cal__dia--fimp"].filter(Boolean).join(" ");
      html += `<button type="button" class="${cls}" data-dia="${iso(data)}" aria-pressed="${!!(ehInicio || ehFim || meio)}" aria-label="${longa.format(data)}${occ ? ", já reservado" : ""}" ${data < hoje ? "disabled" : ""}><span>${d}</span></button>`;
    }
    diasEl.innerHTML = html;
    legendaEl.hidden = !diasEl.querySelector(".cal__dia--ocupado");
  };

  diasEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-dia]");
    if (!b || b.disabled) return;
    const [a, m, d] = b.dataset.dia.split("-").map(Number);
    const data = new Date(a, m - 1, d);
    if (!inicio || fim || data < inicio) { inicio = data; fim = null; }
    else if (+data !== +inicio) fim = data;
    desenhar(); atualizarEscolha();
  });
  quartosEl.addEventListener("change", atualizarEscolha);
  limparBtn.addEventListener("click", () => { inicio = fim = null; desenhar(); atualizarEscolha(); });
  antBtn.addEventListener("click", () => { vista = new Date(vista.getFullYear(), vista.getMonth() - 1, 1); desenhar(); });
  proxBtn.addEventListener("click", () => { vista = new Date(vista.getFullYear(), vista.getMonth() + 1, 1); desenhar(); });
  desenhar(); atualizarEscolha();

  // Busca os dias reservados na agenda do Google e risca no calendário
  fetch(CONFIG.agendaUrl, { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : { dias: [] }))
    .then(({ dias: ds = [] }) => {
      CONFIG.datasOcupadas = [...new Set([...CONFIG.datasOcupadas, ...ds])];
      desenhar(); atualizarEscolha();
    })
    .catch(() => {});
}

// Ano no rodapé
document.querySelector("[data-ano]").textContent = new Date().getFullYear();
