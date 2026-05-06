# 🎮 FreeGameRadar

Monitors **Steam, Epic Games, GOG, and Prime Gaming** for free games and sends you a beautiful HTML email whenever new ones drop.

---

## Quick Start

### 1. Install dependencies

```bash
cd freegame-radar
npm install
```

### 2. Configure your email

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | What to put |
|---|---|
| `EMAIL_USER` | Your Gmail address |
| `EMAIL_PASS` | A Gmail **App Password** (see below) |
| `NOTIFY_EMAIL` | Where to send alerts (can be same as above) |
| `CHECK_INTERVAL` | Cron schedule (default: `0 9 * * *` = 9am daily) |

### 3. Get a Gmail App Password

> Regular Gmail password won't work — you need an App Password.

1. Go to [myaccount.google.com](https://myaccount.google.com) → **Security**
2. Enable **2-Step Verification** if not already on
3. Search for **"App Passwords"** → Create one for **Mail**
4. Copy the 16-character password into `EMAIL_PASS` in your `.env`

### 4. Run it

```bash
npm start
```

That's it! It checks immediately on startup, then runs on your cron schedule.

---

## Commands

```bash
# Start the full tracker (with email + cron)
npm start

# Just check what's free right now (no email sent)
npm run check
```

---

## Schedule Examples

Edit `CHECK_INTERVAL` in your `.env`:

```
0 9 * * *       → Every day at 9:00 AM        (default)
0 9,18 * * *    → Twice a day at 9AM & 6PM
0 */4 * * *     → Every 4 hours
* * * * *       → Every minute (for testing)
```

---

## How It Works

```
index.js          — Cron scheduler + entry point
src/tracker.js    — Fetches free games from all 4 platforms
src/notifier.js   — Builds and sends the HTML email
src/state.js      — Remembers which games you've already been notified about
data/seen-games.json — Auto-created; tracks notified games
```

- **Smart deduplication**: won't re-notify you about the same game
- **Runs once on startup**, then sticks to the schedule
- **Keep it running** with `npm start` in a terminal, or use a tool like `pm2`:

```bash
npm install -g pm2
pm2 start index.js --name freegame-radar
pm2 save          # auto-restart on reboot
```

---

## Using a Different Email Provider

Change `SMTP_HOST` and `SMTP_PORT` in `.env`:

| Provider | SMTP Host | Port |
|---|---|---|
| Gmail | smtp.gmail.com | 587 |
| Outlook/Hotmail | smtp.office365.com | 587 |
| Yahoo | smtp.mail.yahoo.com | 587 |
| ProtonMail (Bridge) | 127.0.0.1 | 1025 |

---

## Troubleshooting

**"Invalid login" error** → Use an App Password, not your Gmail password  
**No games found** → APIs can be flaky; run `npm run check` again  
**Email not arriving** → Check spam folder; verify App Password is correct  
