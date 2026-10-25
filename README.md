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
`fly.toml` ist dafür vorbereitet: eine Maschine in Amsterdam (`ams`), immer an, mit einem Volume unter `/data`.

**Einrichten über das Fly-Dashboard** (Fly.io ist mit GitHub verknüpft):

1. Im [Fly-Dashboard](https://fly.io/dashboard) eine App aus dem GitHub-Repo starten (Branch `main`).
   Fly übernimmt die Einstellungen aus `fly.toml` und legt das Volume `wichtel_data` (1 GB) beim ersten Start selbst an.
2. In der App unter **Secrets** eintragen:
   `BASE_URL` (z. B. `https://<dein-app-name>.fly.dev`), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`.
3. Deployen bzw. neu deployen. Danach läuft die App unter `https://<dein-app-name>.fly.dev`.

Fly legt beim Launch eventuell einen Branch `flyio-new-files` mit einer eigenen `fly.toml` an. Den nicht mergen:
maßgeblich ist die `fly.toml` auf `main` (u. a. `internal_port = 3000`, passend zu `PORT`).

- **Nur eine Maschine!** Daten und Zeitplan liegen in einer Datei, deshalb nicht hochskalieren.
- **SMTP ist auf dem Server Pflicht.** Ohne SMTP landen die Mails in `outbox/` im Container und gehen beim nächsten Deploy verloren.
- **Eigene Domain:** im Dashboard unter *Certificates* hinzufügen, DNS laut Anweisung setzen, dann `BASE_URL` anpassen.
- **Backup** (mit [flyctl](https://fly.io/docs/flyctl/install/)): `fly ssh sftp get /data/wichtel.json`

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
