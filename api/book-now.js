export default async function handler(req, res) {
  // ---------- CORS ----------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // รองรับทั้ง POST body และ query
    const data = req.method === "POST" ? (req.body || {}) : {};

    const hotel      = data.hotel      ?? req.query.hotel      ?? "";
    const area       = data.area       ?? req.query.area       ?? "";
    const guestName  = data.guestName  ?? "";
    const guestCount = Number(data.guestCount ?? 0);
    const phone      = data.phone      ?? "";
    const checkIn    = data.checkIn    ?? "";
    const checkOut   = data.checkOut   ?? "";
    const nights     = Number(data.nights ?? 0);
    const roomCount  = Number(data.roomCount ?? 0);
    const petType    = data.petType    ?? "";
    const petCount   = Number(data.petCount ?? 0);

    // ---------- FLEX MESSAGE ----------
    const flexMessage = {
      type: "flex",
      altText: `ยืนยันการจอง: ${hotel}`,
      contents: {
        type: "bubble",
        size: "mega",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: "Pet Journey Booking",
              weight: "bold",
              size: "lg"
            },
            {
              type: "separator"
            },
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                { type: "text", text: `🏨 โรงแรม: ${hotel}`, wrap: true },
                { type: "text", text: `📍 พื้นที่: ${area}`, wrap: true },
                { type: "text", text: `👤 ผู้จอง: ${guestName}`, wrap: true },
                { type: "text", text: `📞 เบอร์โทร: ${phone}`, wrap: true },
                { type: "text", text: `🛏 ห้องพัก: ${roomCount} ห้อง`, wrap: true },
                { type: "text", text: `👥 ผู้เข้าพัก: ${guestCount} คน`, wrap: true },
                { type: "text", text: `🐾 สัตว์เลี้ยง: ${petType} (${petCount} ตัว)`, wrap: true },
                {
                  type: "text",
                  text: `📅 ${checkIn} → ${checkOut} (${nights} คืน)`,
                  wrap: true
                }
              ]
            }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "ทีมงานจะติดต่อกลับเพื่อยืนยันการจอง",
              size: "sm",
              color: "#666666",
              wrap: true
            }
          ]
        }
      }
    };

    // ---------- RESPONSE ----------
    return res.status(200).json({
      ok: true,
      flex: flexMessage
    });

  } catch (error) {
    console.error("BOOK NOW ERROR:", error);
    return res.status(500).json({
      ok: false,
      error: "BOOK_NOW_FAILED",
      message: String(error)
    });
  }
}
