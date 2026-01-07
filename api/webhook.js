export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");

  try {
    // กันกรณี body ยังไม่ถูก parse / เป็น string
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const events = Array.isArray(body.events) ? body.events : [];

    if (events.length === 0) return res.status(200).end();

    for (const event of events) {
      if (event?.type === "message" && event?.message?.type === "text") {
        const text = (event.message.text || "").toLowerCase();
        if (text.includes("จอง") || text.includes("booking")) {
          await replyFlex(event.replyToken);
        }
      }
    }

    return res.status(200).end();
  } catch (err) {
    console.error("Webhook crash:", err);
    return res.status(500).json({ error: err?.message || "unknown error" });
  }
}

async function replyFlex(replyToken) {
  if (!replyToken) return;

  const body = {
    replyToken,
    messages: [
      {
        type: "flex",
        altText: "เริ่มการจอง Pet Journey",
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            spacing: "md",
            contents: [
              { type: "text", text: "🐾 Pet Journey Booking", weight: "bold", size: "lg" },
              { type: "text", text: "กรุณาระบุรายละเอียดการจอง", wrap: true },
              {
                type: "text",
                text: "• โรงแรม\n• วันที่เข้าพัก\n• จำนวนสัตว์เลี้ยง",
                wrap: true,
                size: "sm",
                color: "#666666",
              },
            ],
          },
        },
      },
    ],
  };

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.error("Missing env: LINE_CHANNEL_ACCESS_TOKEN");
    return;
  }

  const r = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    console.error("LINE reply failed:", r.status, t);
  }
}
