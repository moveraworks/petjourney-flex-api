export default async function handler(req, res) {
  // ---- CORS ----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ✅ รองรับทั้ง GET (query) และ POST (body)
    const payload = req.method === "POST" ? (req.body || {}) : (req.query || {});

    const hotel = payload.hotel || "";
    const area = payload.area || "";
    const guestName = payload.guestName || "";
    const phone = payload.phone || "";
    const checkIn = payload.checkIn || "";
    const checkOut = payload.checkOut || "";
    const nights = payload.nights || "";
    const petType = payload.petType || "";
    const petCount = payload.petCount || "";

    return res.status(200).json({
      ok: true,
      received: payload, // 👈 ไว้ดูว่ามาครบไหม
      flex: {
        type: "flex",
        altText: `จอง: ${hotel || "Pet Journey"}`,
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              { type: "text", text: "Pet Journey Booking", weight: "bold", size: "lg" },
              { type: "separator", margin: "md" },

              { type: "text", text: `โรงแรม: ${hotel}`, wrap: true },
              { type: "text", text: `พื้นที่: ${area}`, wrap: true },

              ...(guestName ? [{ type: "text", text: `ผู้เข้าพัก: ${guestName}`, wrap: true }] : []),
              ...(phone ? [{ type: "text", text: `เบอร์: ${phone}`, wrap: true }] : []),
              ...((checkIn || checkOut) ? [{ type: "text", text: `วันที่: ${checkIn} - ${checkOut}`, wrap: true }] : []),
              ...(nights ? [{ type: "text", text: `จำนวนคืน: ${nights}`, wrap: true }] : []),
              ...((petType || petCount) ? [{ type: "text", text: `สัตว์เลี้ยง: ${petType} (${petCount} ตัว)`, wrap: true }] : []),
            ],
          },
        },
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
