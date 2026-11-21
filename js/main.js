/* =========================================================
   King Eventos — configuração
   Troque o número abaixo pelo WhatsApp real (DDI + DDD + número, só dígitos).
   ========================================================= */
const CONFIG = {
  whatsapp: "5500000000000",
};

// Links de WhatsApp com mensagem pronta (atributo data-wa)
document.querySelectorAll("[data-wa]").forEach((el) => {
  const msg = encodeURIComponent(el.dataset.wa);
  el.href = `https://wa.me/${CONFIG.whatsapp}?text=${msg}`;
  el.target = "_blank";
  el.rel = "noopener";
});

// Foto ainda não enviada: remove a <img> quebrada e deixa o placeholder de azulejo
document.querySelectorAll(".foto img").forEach((img) => {
  const falhou = () => img.remove();
  if (img.complete && img.naturalWidth === 0) falhou();
  else img.addEventListener("error", falhou, { once: true });
});

// Topo muda de cor ao rolar
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
const fechar = () => {
  menu.classList.remove("is-aberto");
  btn.setAttribute("aria-expanded", "false");
  btn.querySelector(".sr").textContent = "Abrir menu";
};
btn.addEventListener("click", () => {
  const aberto = menu.classList.toggle("is-aberto");
  btn.setAttribute("aria-expanded", String(aberto));
  btn.querySelector(".sr").textContent = aberto ? "Fechar menu" : "Abrir menu";
});
menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", fechar));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") fechar(); });

// Ano no rodapé
document.querySelector("[data-ano]").textContent = new Date().getFullYear();
