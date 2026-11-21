/* =========================================================
   King Eventos — configuração
   Número do WhatsApp: DDI + DDD + número, só dígitos.
   ========================================================= */
const CONFIG = {
  whatsapp: "5514998140623",
  // Datas já alugadas (ano-mês-dia). Aparecem riscadas no calendário.
  datasOcupadas: ["2026-12-31"],
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

// Calendário: a data escolhida vai pronta na mensagem do WhatsApp
{
  const cal = document.querySelector("[data-cal]");
  const diasEl = cal.querySelector("[data-cal-dias]");
  const mesEl = cal.querySelector("[data-cal-mes]");
  const escolhaEl = cal.querySelector("[data-cal-escolha]");
  const antBtn = cal.querySelector("[data-cal-ant]");
  const proxBtn = cal.querySelector("[data-cal-prox]");
  const zap = document.querySelector("[data-cal-btn]");
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
  const longa = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const curta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const semana = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });
  let vista = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  let escolhida = null;

  const linkZap = (msg) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;

  const atualizarEscolha = () => {
    if (!escolhida) {
      escolhaEl.textContent = "Nenhuma data escolhida";
      zap.textContent = "Consultar datas no WhatsApp";
      zap.href = linkZap(zap.dataset.wa);
      return;
    }
    const ocupada = CONFIG.datasOcupadas.includes(iso(escolhida));
    escolhaEl.innerHTML = `Data escolhida: <strong>${longa.format(escolhida)}</strong>` + (ocupada ? " (já alugada, mas pergunte por outras)" : "");
    zap.textContent = `Consultar ${curta.format(escolhida).slice(0, 5)} no WhatsApp`;
    zap.href = linkZap(`Olá! Vim pelo site e quero saber se o dia ${curta.format(escolhida)} (${semana.format(escolhida)}) está disponível na King Eventos.`);
  };

  const desenhar = () => {
    const t = nomeMes.format(vista); mesEl.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    antBtn.disabled = vista <= new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const primeiro = vista.getDay();
    const total = new Date(vista.getFullYear(), vista.getMonth() + 1, 0).getDate();
    let html = "";
    for (let i = 0; i < primeiro; i++) html += "<span></span>";
    for (let d = 1; d <= total; d++) {
      const data = new Date(vista.getFullYear(), vista.getMonth(), d);
      const passado = data < hoje;
      const ocupada = CONFIG.datasOcupadas.includes(iso(data));
      const fim = data.getDay() === 0 || data.getDay() === 6;
      const sel = escolhida && iso(escolhida) === iso(data);
      const cls = ["cal__dia", fim && "cal__dia--fim", ocupada && "cal__dia--ocupado", +data === +hoje && "cal__dia--hoje"].filter(Boolean).join(" ");
      html += `<button type="button" class="${cls}" data-dia="${iso(data)}" aria-pressed="${!!sel}" aria-label="${longa.format(data)}${ocupada ? ", já alugado" : ""}" ${passado ? "disabled" : ""}>${d}</button>`;
    }
    diasEl.innerHTML = html;
  };

  diasEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-dia]");
    if (!b || b.disabled) return;
    const [a, m, d] = b.dataset.dia.split("-").map(Number);
    escolhida = new Date(a, m - 1, d);
    desenhar(); atualizarEscolha();
  });
  antBtn.addEventListener("click", () => { vista = new Date(vista.getFullYear(), vista.getMonth() - 1, 1); desenhar(); });
  proxBtn.addEventListener("click", () => { vista = new Date(vista.getFullYear(), vista.getMonth() + 1, 1); desenhar(); });
  desenhar();
}

// Ano no rodapé
document.querySelector("[data-ano]").textContent = new Date().getFullYear();
