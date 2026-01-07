// api/webhook.js

const LINE_REPLY_API = "https://api.line.me/v2/bot/message/reply";

async function replyMessage(replyToken, messages) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("Missing LINE_CHANNEL_ACCESS_TOKEN");

  const res = await fetch(LINE_REPLY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LINE reply failed: ${res.status} ${text}`);
  }
}

function parseStartBooking(text) {
  // ตัวอย่าง: START_BOOKING|hotel=Shama%20Yen%20Akart|area=%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E
  const parts = text.split("|").slice(1);
  const data = Object.fromEntries(parts.map((p) => p.split("=")));
  return {
    hotel: decodeURIComponent(data.hotel || ""),
    area: decodeURIComponent(data.area || ""),
  };
}

export default async function handler(req, res) {
  try {
    // LINE จะ POST มาเท่านั้น
    if (req.method !== "POST") return res.status(200).send("OK");

    const body = req.body;

    // กันกรณี body ไม่ใช่รูปแบบที่คาด
    if (!body || !Array.isArray(body.events)) {
      return res.status(200).send("No events");
    }

    // จัดการทีละ event
    for (const event of body.events) {
      if (event.type !== "message") continue;
      if (event.message?.type !== "text") continue;

      const text = event.message.text || "";
      const replyToken = event.replyToken;

      // 1) TEST
      if (text === "TEST SEND") {
        await replyMessage(replyToken, [
          { type: "text", text: "✅ TEST SEND OK" },
        ]);
        continue;
      }

      // 2) START_BOOKING
      if (text.startsWith("START_BOOKING")) {
        const { hotel, area } = parseStartBooking(text);

        const flex = {
          type: "flex",
          altText: "เริ่มจองที่พัก",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                { type: "text", text: "🐾 Pet Journey Booking", weight: "bold", size: "lg" },
                { type: "text", text: `โรงแรม: ${hotel}`, wrap: true },
                { type: "text", text: `พื้นที่: ${area}`, size: "sm", color: "#666666", wrap: true },
                { type: "separator" },
                { type: "text", text: "📅 ต้องการเข้าพักวันที่เท่าไหร่?", wrap: true },
                { type: "text", text: "พิมพ์ตอบกลับเป็นวันที่ เช่น 2026-01-10", size: "sm", color: "#888888", wrap: true },
              ],
            },
          },
        };

        await replyMessage(replyToken, [flex]);
        continue;
      }

      // 3) fallback
      await replyMessage(replyToken, [
        { type: "text", text: `รับข้อความแล้ว: ${text}` },
      ]);
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    return res.status(200).send("OK"); // LINE ต้องได้ 200 เพื่อไม่ retry รัวๆ
  }
}
