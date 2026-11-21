# King Eventos

Site institucional de uma área de lazer para festas e day use, com piscina, churrasqueira e salão.
O objetivo do site é levar o visitante a consultar datas pelo WhatsApp, com as informações que ele precisa para decidir antes de chamar: estrutura, valores, como reservar, dúvidas e localização.

**Site:** https://www.SEUDOMINIO.com.br

## Decisões de design

- **Preto e dourado, como a marca.** A identidade parte do flyer e do letreiro da King: coroa e "KING" em dourado metálico sobre preto. Títulos em Cinzel (serifa romana, a mesma família visual do logo) e texto em Manrope.
- **Foto noturna no topo.** A piscina iluminada com o mural da casa abre o site e conversa com o fundo preto.
- **Faixa de estrutura.** A linha de ícones do flyer (piscina aquecida, campinho, playground, TV 75", churrasqueira, sinuca) virou a primeira coisa depois do topo, com ícones próprios em traço dourado.
- **Tour em vídeo.** Um vídeo vertical de 21 s, sem som, que toca só quando aparece na tela.
- **Agenda de datas especiais.** Natal e Ano Novo com status, como no flyer.

| Token       | Cor       | Uso                    |
|-------------|-----------|------------------------|
| Preto       | `#000000` | Fundo                  |
| Carvão      | `#12100D` | Superfícies            |
| Ouro        | `#D4A73C` | Ícones, detalhes       |
| Ouro claro  | `#F3D47A` | Títulos                |
| Marfim      | `#F4EEE2` | Texto                  |

## Fotos e vídeo

As fotos originais foram recortadas (tirando objetos de obra e sombras), corrigidas em cor e contraste, tratadas contra ruído nas noturnas e exportadas em WebP. O vídeo do tour junta quatro trechos gravados ao entardecer, com leve ajuste de cor, em H.264.

## Tecnologia

HTML, CSS e JavaScript puros, sem build. Responsivo, com foco de teclado visível, `prefers-reduced-motion` respeitado e dados estruturados (`schema.org/EventVenue`) para SEO local.

```
├── index.html
├── css/styles.css
├── js/main.js        ← número do WhatsApp (CONFIG)
├── img/fotos/        ← fotos tratadas (.webp)
├── img/video/        ← tour.mp4 + poster
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
- [ ] Cidade, endereço e mapa (`index.html`)
- [ ] Respostas das dúvidas frequentes e passos de reserva
- [ ] Status das datas especiais (seção `#datas`)
