# 🎄 Wichtelwerkstatt

Eine kleine, weihnachtliche Wichtel-App: Aktion anlegen, Freunde & Familie per Link einladen,
mit einem Klick die Lose ziehen. Jede Person bekommt dann per E-Mail, wen sie beschenken darf, samt Wunschzettel.

## Starten

```bash
npm install
npm start          # → http://localhost:3000
```

## Ablauf

1. **Startseite**: Aktion anlegen (Name, max. Betrag, Wichtelzeitpunkt, Einladungstext).
   Danach landest du in der **Oberwichtel-Zentrale**. Speichere dir diesen Link, denn nur damit kannst du die Aktion verwalten.
   Gibst du deine E-Mail an, bekommst du den Link zusätzlich per Mail.
2. **Einladungslink** verschicken (Kopieren, WhatsApp oder E-Mail).
3. Eingeladene tragen **Name, E-Mail und Wunschzettel** ein. Mit derselben E-Mail können sie ihre Angaben später noch ändern.
4. In der Zentrale legst du **Ausschlüsse** fest (zwei Personen, die sich nicht gegenseitig ziehen).
5. **🎲 Jetzt ziehen!** startet die Ziehung. Alternativ kannst du einen Zeitpunkt für eine automatische Ziehung einplanen.

Regeln der Ziehung: Niemand zieht sich selbst, ausgeschlossene Paare ziehen sich nicht gegenseitig, und jede Person wird genau einmal gezogen.
Man braucht mindestens 3 Teilnehmende. Wer wen gezogen hat, sieht auch der Oberwichtel nicht.

## E-Mail-Versand einrichten

Ohne Konfiguration werden die Mails als HTML-Dateien im Ordner `outbox/` gespeichert, das reicht zum Ausprobieren.
Für echten Versand setzt du diese Umgebungsvariablen:

| Variable      | Beispiel                     |
|---------------|------------------------------|
| `SMTP_HOST`   | `smtp.gmail.com`             |
| `SMTP_PORT`   | `587` (oder `465`)           |
| `SMTP_SECURE` | `true` bei Port 465          |
| `SMTP_USER`   | `deine.adresse@gmail.com`    |
| `SMTP_PASS`   | App-Passwort                 |
| `MAIL_FROM`   | `"Wichtelwerkstatt <deine.adresse@gmail.com>"` |
| `BASE_URL`    | `https://wichteln.example.de` (für Links in Mails) |
| `PORT`        | `3000`                       |

Bei Gmail brauchst du ein [App-Passwort](https://myaccount.google.com/apppasswords).

## Hosting auf Fly.io

Die App braucht einen Server, der immer läuft (geplante Ziehungen), und einen dauerhaften Speicher für `wichtel.json`.
`fly.toml` ist dafür vorbereitet: eine Maschine in Frankfurt, immer an, mit einem Volume unter `/data`.

**Einmalig einrichten** (mit [flyctl](https://fly.io/docs/flyctl/install/)):

```bash
fly auth signup                      # oder: fly auth login
fly launch --copy-config --no-deploy --name <dein-app-name>   # Name muss weltweit eindeutig sein
fly volumes create wichtel_data --region fra --size 1
fly secrets set BASE_URL=https://<dein-app-name>.fly.dev \
  SMTP_HOST=smtp.gmail.com SMTP_PORT=587 \
  SMTP_USER=deine.adresse@gmail.com SMTP_PASS=<app-passwort> \
  MAIL_FROM="Wichtelwerkstatt <deine.adresse@gmail.com>"
fly deploy --ha=false
```

Danach läuft die App unter `https://<dein-app-name>.fly.dev`.

- **Nur eine Maschine!** Daten und Zeitplan liegen in einer Datei, deshalb `--ha=false` und nicht hochskalieren.
- **SMTP ist auf dem Server Pflicht.** Ohne SMTP landen die Mails in `outbox/` im Container und gehen beim nächsten Deploy verloren.
- **Eigene Domain:** `fly certs add wichteln.example.de`, DNS laut Anweisung setzen, dann `BASE_URL` anpassen.
- **Backup:** `fly ssh sftp get /data/wichtel.json`

**Automatisch deployen:** `.github/workflows/fly-deploy.yml` deployt bei jedem Push auf `main`
(oder manuell unter *Actions → Fly Deploy → Run workflow*). Dafür einmal `fly tokens create deploy` ausführen
und das Token im GitHub-Repo unter *Settings → Secrets and variables → Actions* als `FLY_API_TOKEN` speichern.

## Technik

- Node.js + Express, ohne Build-Schritt
- Daten liegen in `data/wichtel.json` (Pfad über `DATA_FILE` änderbar)
- Frontend: reines HTML/CSS/JS, handgezeichnete SVG-Grafiken, Schriften *Caveat* & *Patrick Hand*

| Datei | Inhalt |
|---|---|
| `server.js` | API, Seiten, geplante Ziehungen |
| `draw.js` | Ziehungs-Algorithmus |
| `mailer.js` | E-Mail-Vorlagen & Versand |
| `store.js` | JSON-Speicher |
| `public/` | Startseite, Oberwichtel-Zentrale, Einladungsseite |
| `Dockerfile`, `fly.toml` | Hosting auf Fly.io |
