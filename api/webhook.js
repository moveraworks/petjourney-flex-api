import crypto from "crypto";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  const events = req.body.events;
  if (!events || events.length === 0) {
    return res.status(200).end();
  }

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const text = event.message.text.toLowerCase();

      if (text.includes("จอง") || text.includes("booking")) {
        await replyFlex(event.replyToken);
      }
    }
  }

  res.status(200).end();
}

async function replyFlex(replyToken) {
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
              {
                type: "text",
                text: "🐾 Pet Journey Booking",
                weight: "bold",
                size: "lg"
              },
              {
                type: "text",
                text: "กรุณาระบุรายละเอียดการจอง",
                wrap: true
              },
              {
                type: "text",
                text: "• โรงแรม\n• วันที่เข้าพัก\n• จำนวนสัตว์เลี้ยง",
                wrap: true,
                size: "sm",
                color: "#666666"
              }
            ]
          }
        }
      }
    ]
  };

  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify(body)
  });
}
