# Somos Ratas 🐭 — Ofertas Mercado Libre → Instagram

Sistema que todos los días investiga los productos más vendidos y mejor calificados de
Mercado Libre Chile, genera posts (captura + caption con la voz de "Somos Ratas" + link de
afiliado) y los deja listos como borrador — y los publica automático en Instagram si hay
credenciales de Meta Graph API configuradas.

- **Cómo funciona / arquitectura:** ver [`src/`](src) — `research.js` busca los productos,
  `caption.js` + `affiliateLink.js` + `screenshot.js` arman cada post, `instagram.js` /
  `publish.js` publican.
- **Cron diario:** [`.github/workflows/daily-posts.yml`](.github/workflows/daily-posts.yml).
- **Guía de configuración (afiliados, cuenta de Instagram Business, secrets, GitHub Pages,
  y el bloqueo de IP a tener en cuenta):** ver [`SETUP.md`](SETUP.md). **Empieza por acá.**
- **Identidad propuesta para la cuenta de Instagram:** ver [`IDENTITY.md`](IDENTITY.md).

Los posts generados quedan en `posts/<fecha>/`, uno por producto, con su imagen, caption y
metadata (precio, rating, link de afiliado, si ya se publicó o no).
