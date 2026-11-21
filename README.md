# King Eventos

Site institucional de uma área de lazer para festas e day use, com piscina, churrasqueira e salão.
O objetivo do site é levar o visitante a consultar datas pelo WhatsApp, com as informações que ele precisa para decidir antes de chamar: estrutura, valores, como reservar, dúvidas e localização.

**Site:** https://www.SEUDOMINIO.com.br

## Decisões de design

- **Conceito "dia de rei".** O nome pede coroa, mas o espaço é de lazer, não de gala. Por isso a paleta troca o dourado e preto de luxo por azul real, água de piscina e amarelo-sol.
- **Hero como piscina.** O topo tem um reflexo de luz na água feito só com SVG (`feTurbulence`) e CSS, sem vídeo nem imagem pesada, e termina numa borda de azulejos.
- **Azulejo como sistema.** A grade da estrutura e os placeholders de foto usam o mesmo rejunte da piscina, ligando a identidade ao espaço físico.
- **Informação antes da conversa.** Diferente dos concorrentes analisados, o site mostra valores, passo a passo de reserva e perguntas frequentes.

| Token        | Cor       | Uso                      |
|--------------|-----------|--------------------------|
| Azul real    | `#1F2F86` | Marca e títulos          |
| Noite        | `#141E57` | Texto                    |
| Água         | `#3FBCDC` | Ícones, detalhes         |
| Água clara   | `#DDF3F8` | Rejunte, fundos          |
| Sol          | `#FFC53D` | Coroa e botões de ação   |

Tipografia: **Big Shoulders Display** (títulos) e **Figtree** (texto), via Google Fonts.

## Tecnologia

HTML, CSS e JavaScript puros, sem build. Responsivo, com foco de teclado visível, `prefers-reduced-motion` respeitado e dados estruturados (`schema.org/EventVenue`) para SEO local.

```
├── index.html
├── css/styles.css
├── js/main.js        ← número do WhatsApp fica aqui (CONFIG)
├── img/              ← fotos (veja img/LEIA-ME.md)
├── vercel.json
├── robots.txt
└── sitemap.xml
```

## Rodar localmente

```bash
npx serve .
# ou
python -m http.server 8000
```

## Publicar

1. Suba o repositório no GitHub.
2. Na Vercel: **Add New → Project → Import** o repositório. Framework: *Other*. Sem comando de build.
3. Em **Settings → Domains**, adicione o domínio e configure o DNS conforme a Vercel indicar.

Cada `git push` na branch `main` publica uma nova versão automaticamente.

## Antes de publicar, trocar

- [ ] `SEUDOMINIO.com.br` em `index.html`, `robots.txt` e `sitemap.xml`
- [ ] Número do WhatsApp em `js/main.js` e no rodapé
- [ ] Cidade, endereço e mapa (`index.html`)
- [ ] Instagram
- [ ] Valores, horários, capacidade e respostas das dúvidas
- [ ] Fotos em `img/`
