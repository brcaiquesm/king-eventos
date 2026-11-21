/* =========================================================
   King Eventos — configuração
   Número do WhatsApp: DDI + DDD + número, só dígitos.
   ========================================================= */
const CONFIG = {
  whatsapp: "5514998140623",
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

// Ano no rodapé
document.querySelector("[data-ano]").textContent = new Date().getFullYear();
