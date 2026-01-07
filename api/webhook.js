import crypto from "crypto";

const LINE_REPLY_ENDPOINT = "https://api.line.me/v2/bot/message/reply";

function verifySignature(body, signature, channelSecret) {
  const hash = crypto
    .createHmac("sha256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

function bookingAskFlex({ hotel, area }) {
  return {
    type: "flex",
    altText: `Pet Journey Booking: ${hotel}`,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: "Pet Journey Booking", weight: "bold", size: "xl" },
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              { type: "text", text: `โรงแรม: ${hotel}`, wrap: true },
              { type: "text", text: `พื้นที่: ${area}`, wrap: true }
            ]
          },
          { type: "separator", margin: "md" },
          {
            type: "text",
            text: "ขอข้อมูลเพื่อจองต่อ 👇",
            weight: "bold",
            margin: "md"
          },
          {
            type: "text",
            text: "1) วันที่เช็คอิน-เช็คเอาท์\n2) จำนวนคน\n3) สัตว์เลี้ยง (ชนิด/จำนวน)\n4) เบอร์ติดต่อ",
            wrap: true,
            color: "#555555"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            action: {
              type: "message",
              label: "พิมพ์รายละเอียดการจอง",
              text: `จอง ${hotel} (${area})\nเช็คอิน:\nเช็คเอาท์:\nจำนวนคน:\nสัตว์เลี้ยง:\nเบอร์โทร:`
            }
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "message", label: "คุยกับแอดมิน", text: "ขอคุยกับแอดมินเรื่องจอง" }
          }
        ]
      }
    }
  };
}

async function replyMessage(replyToken, messages, accessToken) {
  const res = await fetch(LINE_REPLY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LINE reply failed: ${res.status} ${text}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  const bodyString = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  const signature = req.headers["x-line-signature"];

  if (!channelSecret || !accessToken) {
    return res.status(500).json({ ok: false, error: "Missing env vars" });
  }

  // Verify signature
  if (!signature || !verifySignature(bodyString, signature, channelSecret)) {
    return res.status(401).json({ ok: false, error: "Invalid signature" });
  }

  const body = typeof req.body === "object" ? req.body : JSON.parse(req.body);

  // LINE will send multiple events
  const events = body.events || [];

  try {
    for (const event of events) {
      if (!event.replyToken) continue;

      // ✅ case A: ผู้ใช้พิมพ์คำว่า "จอง" หรือส่งฟอร์ม
      if (event.type === "message" && event.message?.type === "text") {
        const text = event.message.text?.trim() || "";

        // ตัวอย่าง: "จอง Shama Yen Akart (กรุงเทพมหานคร)"
        if (text.startsWith("จอง")) {
          const hotel = "โรงแรมที่เลือก";
          const area = "พื้นที่ที่เลือก";
          // ถ้าอยาก parse ชื่อจากข้อความทีหลังค่อยเพิ่มได้
          await replyMessage(event.replyToken, [bookingAskFlex({ hotel, area })], accessToken);
          continue;
        }

        // fallback
        await replyMessage(
          event.replyToken,
          [{ type: "text", text: "พิมพ์คำว่า “จอง” หรือกด BOOK NOW เพื่อเริ่มจองได้เลยครับ 🙂" }],
          accessToken
        );
        continue;
      }

      // ✅ case B: ถ้าคุณทำ Rich Menu / Postback ในอนาคต (มี data)
      if (event.type === "postback") {
        const data = event.postback?.data || "";
        // รูปแบบที่แนะนำ: "action=book&hotel=...&area=..."
        const params = new URLSearchParams(data);
        const hotel = params.get("hotel") || "โรงแรมที่เลือก";
        const area = params.get("area") || "พื้นที่ที่เลือก";

        await replyMessage(event.replyToken, [bookingAskFlex({ hotel, area })], accessToken);
        continue;
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
