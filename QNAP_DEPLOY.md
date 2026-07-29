# QNAP NAS deployment met Docker en Apache

Deze app gebruikt Next.js, API-routes, login-sessies en SQLite. Daardoor kan hij niet als losse statische map door Apache worden geserveerd. De juiste setup is:

- Next.js draait in een Docker-container op poort `3000`
- Apache draait publiek op poort `80` of `443`
- Apache proxy't requests door naar de Next.js app
- SQLite staat als bestand op de NAS, buiten de container

## Benodigd

- QNAP Container Station of Docker Compose
- Apache modules `proxy`, `proxy_http` en `headers`
- SSH-toegang tot de NAS

## Aanbevolen: Container Station

Plaats de app bijvoorbeeld in:

```bash
/share/Container/cybercheck
```

Maak alvast de datamap voor SQLite:

```bash
mkdir -p /share/Container/cybercheck/data
```

Build en start daarna de container:

```bash
cd /share/Container/cybercheck
docker compose up -d --build
```

De container draait dan op:

```text
http://NAS-IP:3000
```

De database staat persistent op:

```text
/share/Container/cybercheck/data/cybercheck.db
```

Bij de eerste start maakt de container automatisch demo-data aan als er nog geen databasebestand bestaat.

De Docker Compose zet `SESSION_COOKIE_SECURE=false`, zodat login ook werkt wanneer je eerst via `http://NAS-IP:3000` test. Zet dit op `true` zodra je de app alleen nog via HTTPS gebruikt.

## Container Station via YAML

In QNAP Container Station kun je ook een app aanmaken op basis van `docker-compose.yml`.

Gebruik het bestand [docker-compose.yml](docker-compose.yml) als je vanuit de projectmap werkt. Wil je liever een vast NAS-pad gebruiken, neem dan [deploy/qnap/docker-compose.qnap.yml](deploy/qnap/docker-compose.qnap.yml) als voorbeeld.

Als je `deploy/qnap/docker-compose.qnap.yml` gebruikt, build dan eerst de image:

```bash
cd /share/Container/cybercheck
docker build -t cybercheck:latest .
docker compose -f deploy/qnap/docker-compose.qnap.yml up -d
```

## Apache reverse proxy

Gebruik [deploy/qnap/apache-cybercheck.conf](deploy/qnap/apache-cybercheck.conf) als voorbeeld.

Belangrijkste regels:

```apache
ProxyPreserveHost On
ProxyPass / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/
```

Zet bij HTTPS ook:

```apache
RequestHeader set X-Forwarded-Proto "https"
```

## Automatisch starten

Met `restart: unless-stopped` start Container Station de container automatisch opnieuw na een reboot, zolang je hem niet handmatig hebt gestopt.

## Demo login

Gebruik voor een lokale demo een zelfgekozen tijdelijk wachtwoord. Zet geen wachtwoord in deze repository. Voor productie moeten ADMIN_EMAIL en ADMIN_PASSWORD als runtime-variabelen worden ingesteld.

## Belangrijk over SQLite

Maak regelmatig een backup van:

```text
/share/Container/cybercheck/data/cybercheck.db
```

Dat bestand bevat de aanmeldingen, studentengroepen, beschikbaarheid en matches.

## Zonder Docker

Wil je toch zonder container draaien, dan kan dat nog steeds via Node.js en het standalone buildscript. Gebruik dan [deploy/qnap/start-cybercheck.sh](deploy/qnap/start-cybercheck.sh) als startscriptsjabloon.
