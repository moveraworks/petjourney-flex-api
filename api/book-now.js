// /api/book-now.js
export default async function handler(req, res) {
  // ---- CORS ----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // --- 1) รับข้อมูลได้ทั้ง GET และ POST ---
    const data =
      req.method === "POST"
        ? (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}))
        : (req.query || {});

    const hotel = (data.hotel || "").toString();
    const area = (data.area || "").toString();
    const guestName = (data.guestName || "").toString();
    const guestCount = (data.guestCount || "").toString();
    const phone = (data.phone || "").toString();
    const checkIn = (data.checkIn || "").toString();
    const checkOut = (data.checkOut || "").toString();
    const nights = (data.nights || "").toString();
    const roomCount = (data.roomCount || "").toString();
    const petType = (data.petType || "").toString();
    const petCount = (data.petCount || "").toString();

    // userId: ถ้าเรียกจาก LIFF/เว็บ ให้ส่ง userId มาด้วย (แนะนำ)
    const userId = (data.userId || "").toString();

    // --- 2) ทำ Flex ให้ดูมืออาชีพ ---
    const rows = [];
    const addRow = (label, value) => {
      if (!value) return;
      rows.push({
        type: "box",
        layout: "baseline",
        spacing: "sm",
        contents: [
          { type: "text", text: label, size: "sm", color: "#6B7280", flex: 3 },
          { type: "text", text: value, size: "sm", color: "#111827", flex: 7, wrap: true },
        ],
      });
    };

    addRow("โรงแรม", hotel);
    addRow("พื้นที่", area);
    addRow("ผู้จอง", guestName);
    addRow("เบอร์โทร", phone);
    addRow("เช็คอิน", checkIn);
    addRow("เช็คเอาท์", checkOut);
    addRow("จำนวนคืน", nights ? `${nights} คืน` : "");
    addRow("จำนวนห้อง", roomCount ? `${roomCount} ห้อง` : "");
    addRow("จำนวนผู้เข้าพัก", guestCount ? `${guestCount} คน` : "");
    addRow("สัตว์เลี้ยง", [petType, petCount ? `${petCount} ตัว` : ""].filter(Boolean).join(" · "));

    const altText = `Pet Journey Booking: ${hotel || "รายการจอง"}`;

    const flexMessage = {
      type: "flex",
      altText,
      contents: {
        type: "bubble",
        size: "mega",
        header: {
          type: "box",
          layout: "vertical",
          paddingAll: "20px",
          contents: [
            { type: "text", text: "Pet Journey", size: "sm", color: "#6B7280" },
            { type: "text", text: "Booking Request", size: "xl", weight: "bold", color: "#111827" },
            { type: "text", text: "กรอกข้อมูลเบื้องต้นเรียบร้อย ✅", size: "sm", color: "#10B981", margin: "md" },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          paddingAll: "20px",
          spacing: "md",
          contents: [
            { type: "text", text: "รายละเอียดการจอง", weight: "bold", size: "md", color: "#111827" },
            { type: "separator" },
            { type: "box", layout: "vertical", spacing: "sm", margin: "md", contents: rows.length ? rows : [
              { type: "text", text: "ไม่มีข้อมูลที่ส่งมา", size: "sm", color: "#6B7280" }
            ]},
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          paddingAll: "20px",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "ขั้นถัดไป: บอทจะถามข้อมูลเพิ่มเติมในแชท",
              size: "sm",
              color: "#6B7280",
              wrap: true,
            },
          ],
        },
      },
    };

    // --- 3) ส่งเข้าแชท (ถ้ามี userId) ---
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (token && userId) {
      const resp = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: userId,
          messages: [flexMessage],
        }),
      });

      const text = await resp.text();
      if (!resp.ok) {
        // ส่ง push ไม่ผ่าน ยังตอบกลับ API ให้เห็นสาเหตุ
        return res.status(200).json({
          ok: false,
          pushed: false,
          reason: "LINE push failed",
          status: resp.status,
          lineResponse: text,
          received: { hotel, area, guestName, guestCount, phone, checkIn, checkOut, nights, roomCount, petType, petCount },
          flex: flexMessage,
        });
      }

      return res.status(200).json({
        ok: true,
        pushed: true,
        to: userId,
        received: { hotel, area, guestName, guestCount, phone, checkIn, checkOut, nights, roomCount, petType, petCount },
        flex: flexMessage,
      });
    }

    // --- 4) ถ้าไม่มี userId ให้คืน flex กลับไป (อย่างน้อยเห็นว่า payload ถูกต้อง) ---
    return res.status(200).json({
      ok: true,
      pushed: false,
      note: "No userId or no LINE_CHANNEL_ACCESS_TOKEN. Returning flex only.",
      received: { hotel, area, guestName, guestCount, phone, checkIn, checkOut, nights, roomCount, petType, petCount },
      flex: flexMessage,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
