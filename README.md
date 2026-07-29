# HU Cybercheck

HU Cybercheck is een compacte planning- en matchingapp voor HBO ICT-cyberveiligheidsscans. Ondernemers en studentengroepen melden zich aan met hun beschikbaarheid; een beheerder krijgt vervolgens een voorstel en kan de uiteindelijke match handmatig bevestigen of aanpassen.

## Functionaliteit

- Aanmelding voor ondernemers en studentengroepen
- Tot tien beschikbaarheidsblokken per aanmelding
- Voorkeur voor een interview op locatie of online
- Beheerdashboard met kandidaten, voorstellen en matchstatussen
- Handmatig aanpassen en bevestigen van automatische matchvoorstellen
- Cookie-login voor de beheeromgeving
- Persistente productieopslag via Cloudflare D1
- HU-huisstijl en responsive dashboardweergave

## Lokaal ontwikkelen

Vereist: Node.js 20 of nieuwer.

```bash
npm ci
npm run dev
```

Voor een lokale D1-preview gebruikt de Sites/Vinext-configuratie de binding `DB`. De productiebeheerder wordt aangemaakt wanneer `ADMIN_EMAIL` en `ADMIN_PASSWORD` als runtime-variabelen zijn ingesteld.

Productiebuild controleren:

```bash
npm run lint
npm run build
```

## Sites-hosting

De app is voorbereid voor Sites-hosting met Vinext, Cloudflare Workers en D1. De configuratie staat in `.openai/hosting.json`; de database wordt bij de eerste request geïnitialiseerd vanuit `drizzle/0000_initial.sql`.

Stel in de Sites-runtime minimaal deze geheime variabelen in:

```text
ADMIN_EMAIL
ADMIN_PASSWORD
```

De productiebuild verwacht `dist/server/index.js` en wordt verpakt met de Sites-hostingtooling. Publieke beschikbaarheid hangt af van de toegangsinstellingen van de Sites-workspace.

## QNAP/Docker

Voor de zelfstandige QNAP-installatie met Container Station staat de handleiding in [QNAP_DEPLOY.md](QNAP_DEPLOY.md). De Dockerbestanden en de QNAP-configuratie blijven beschikbaar voor NAS-hosting naast de Sites-variant.

## Projectstructuur

- `src/app`: pagina's, API-routes en server actions
- `src/lib/db.ts`: D1-datalaag en schema-initialisatie
- `drizzle/0000_initial.sql`: database-schema voor deployments
- `worker/index.ts`: Cloudflare Worker-entrypoint
- `vite.config.ts`: Vinext/Sites buildconfiguratie
