const nodemailer = require("nodemailer");

// ─── Build HTML Email ─────────────────────────────────────────────────────────

function buildEmailHTML(games) {
  const platformColors = {
    "Epic Games": "#2563eb",
    Steam: "#1e3a5f",
    GOG: "#7c3aed",
    "Prime Gaming": "#c2410c",
  };

  const gameCards = games
    .map((g) => {
      const color = platformColors[g.platform] || "#374151";
      return `
      <div style="background:#1e1e2e;border-radius:10px;padding:16px;margin-bottom:12px;border-left:4px solid ${color}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <span style="background:${color};color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:1px">${g.platform}</span>
            <h2 style="color:#f0f0ff;font-size:17px;font-weight:700;margin:8px 0 4px">${g.title}</h2>
            ${g.description ? `<p style="color:#8b8ba7;font-size:13px;margin:0 0 8px">${g.description.slice(0, 120)}${g.description.length > 120 ? "…" : ""}</p>` : ""}
            <div style="display:flex;gap:12px;font-size:12px;color:#8b8ba7">
              <span>💰 Was: <s>${g.originalPrice}</s></span>
              <span>⏱ Expires: ${g.expiryDate}</span>
            </div>
          </div>
        </div>
        <a href="${g.url}" style="display:inline-block;margin-top:12px;background:${color};color:#fff;text-decoration:none;padding:8px 18px;border-radius:7px;font-size:13px;font-weight:700">
          Claim Free →
        </a>
      </div>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">

    <div style="text-align:center;margin-bottom:28px">
      <div style="display:inline-block;background:#7c6af7;border-radius:12px;width:48px;height:48px;line-height:48px;font-size:24px;margin-bottom:12px">🎮</div>
      <h1 style="color:#f0f0ff;font-size:22px;font-weight:800;margin:0 0 4px">FreeGameRadar</h1>
      <p style="color:#6b6b8a;font-size:13px;margin:0">${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
    </div>

    <div style="background:#13131a;border-radius:12px;padding:20px;margin-bottom:16px;text-align:center">
      <span style="font-size:32px;font-weight:800;color:#22d3a5">${games.length}</span>
      <span style="color:#8b8ba7;font-size:14px;margin-left:8px">free game${games.length !== 1 ? "s" : ""} available right now</span>
    </div>

    ${gameCards}

    <div style="text-align:center;margin-top:24px;color:#4b4b6a;font-size:11px;font-family:monospace">
      FreeGameRadar · Running on GitHub Actions<br>
      <a href="#" style="color:#7c6af7">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`;
}

// ─── Send Email ───────────────────────────────────────────────────────────────

async function sendNotificationEmail(games, config) {
  const { senderPassword, recipientEmail, smtpHost, smtpPort } = config;

  if (!senderPassword || !recipientEmail) {
    console.error(
      "❌ Email config incomplete. Check your .env file (EMAIL_USER, EMAIL_PASS, NOTIFY_EMAIL)."
    );
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost || "smtp-relay.brevo.com",
    port: smtpPort || 587,
    secure: false,
    auth: {
      user: config.senderEmail,
      pass: senderPassword,
    },
  });

  try {
    await transporter.verify();

    const plainText = games
      .map((g) => `• [${g.platform}] ${g.title} — ${g.url}`)
      .join("\n");

    await transporter.sendMail({
      from: `"FreeGameRadar 🎮" <rishonpremson01@gmail.com>`,
      to: recipientEmail,
      subject: `🎮 ${games.length} free game${games.length !== 1 ? "s" : ""} available today!`,
      text: `Free games right now:\n\n${plainText}`,
      html: buildEmailHTML(games),
    });

    console.log(`✉  Email sent to ${recipientEmail}`);
    return true;
  } catch (err) {
    console.error("❌ Email failed:", err.message);
    if (err.message.includes("Invalid login")) {
      console.error(
        "   → For Gmail: use an App Password, not your main password."
      );
      console.error(
        "   → Guide: https://support.google.com/accounts/answer/185833"
      );
    }
    return false;
  }
}

module.exports = { sendNotificationEmail };
