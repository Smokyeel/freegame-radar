require("dotenv").config();
const cron = require("node-cron");
const { fetchAllFreeGames } = require("./src/tracker");
const { sendNotificationEmail } = require("./src/notifier");
const { filterNewGames, markGamesSeen } = require("./src/state");

// ─── Config (loaded from .env) ────────────────────────────────────────────────

const emailConfig = {
  senderEmail: process.env.EMAIL_USER,
  senderPassword: process.env.EMAIL_PASS,
  recipientEmail: process.env.NOTIFY_EMAIL,
  smtpHost: process.env.SMTP_HOST || "smtp.office365.com",
  smtpPort: parseInt(process.env.SMTP_PORT || "587"),
};

const CHECK_INTERVAL = process.env.CHECK_INTERVAL || "0 9 * * *"; // Default: 9am daily
const ONLY_NOTIFY_NEW = process.env.ONLY_NOTIFY_NEW !== "false"; // Default: skip already-seen games

// ─── Core Check Routine ───────────────────────────────────────────────────────

async function runCheck() {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`🕐  ${new Date().toLocaleString()} — Running check`);
  console.log("─".repeat(50));

  const allGames = await fetchAllFreeGames();

  if (allGames.length === 0) {
    console.log("😴 No free games found right now.");
    return;
  }

  const gamesToNotify = ONLY_NOTIFY_NEW
    ? filterNewGames(allGames)
    : allGames;

  if (gamesToNotify.length === 0) {
    console.log("✅ No NEW games since last check — skipping email.");
    return;
  }

  console.log(
    `\n🆕 ${gamesToNotify.length} new game(s) to notify about. Sending email...\n`
  );

  const sent = await sendNotificationEmail(gamesToNotify, emailConfig);
  if (sent) markGamesSeen(gamesToNotify);
}

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🎮 FreeGameRadar started!");
  console.log(`📅 Schedule: "${CHECK_INTERVAL}"`);
  console.log(`📧 Notifying: ${emailConfig.recipientEmail || "⚠ Not configured"}`);
  console.log(`🔔 Only new games: ${ONLY_NOTIFY_NEW}\n`);

  // Run immediately on startup
  await runCheck();

  // Then run on cron schedule
  cron.schedule(CHECK_INTERVAL, runCheck);
  console.log(`\n⏳ Waiting for next scheduled check... (Ctrl+C to stop)\n`);
}

main().catch(console.error);
