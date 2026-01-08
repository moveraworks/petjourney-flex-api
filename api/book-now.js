export default async function handler(req, res) {
  // ---- CORS ----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // handle preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ✅ รองรับ body เป็น string / object
    const body =
      req.method === "POST"
        ? (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}))
        : {};

    // ✅ อ่านจาก POST body ก่อน ถ้าไม่มีค่อยอ่านจาก query
    const hotel = body.hotel ?? req.query.hotel ?? "";
    const area = body.area ?? req.query.area ?? "";

    const guestName = body.guestName ?? req.query.guestName ?? "";
    const guestCount = Number(body.guestCount ?? req.query.guestCount ?? 0);

    const phone = body.phone ?? req.query.phone ?? "";
    const checkIn = body.checkIn ?? req.query.checkIn ?? "";
    const checkOut = body.checkOut ?? req.query.checkOut ?? "";
    const nights = Number(body.nights ?? req.query.nights ?? 0);

    const roomCount = Number(body.roomCount ?? req.query.roomCount ?? 0);

    const petType = body.petType ?? req.query.petType ?? "";
    const petCount = Number(body.petCount ?? req.query.petCount ?? 0);

    const userId = body.userId ?? req.query.userId ?? "";

    // ✅ validation ขั้นต่ำกันพัง
    if (!hotel || !area) {
      return res.status(400).json({ ok: false, error: "missing hotel/area" });
    }

    // ✅ response ที่ Lovable/LINE ใช้ต่อได้
    return res.status(200).json({
      ok: true,
      data: {
        hotel,
        area,
        guestName,
        guestCount,
        phone,
        checkIn,
        checkOut,
        nights,
        roomCount,
        petType,
        petCount,
        userId,
      },
      flex: {
        type: "flex",
        altText: `จอง: ${hotel}`,
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              { type: "text", text: "Pet Journey Booking", weight: "bold", size: "lg" },
              { type: "text", text: `โรงแรม: ${hotel}`, wrap: true },
              { type: "text", text: `พื้นที่: ${area}`, wrap: true },

              ...(guestName ? [{ type: "text", text: `ชื่อผู้จอง: ${guestName}`, wrap: true }] : []),
              ...(guestCount ? [{ type: "text", text: `จำนวนผู้เข้าพัก: ${guestCount}`, wrap: true }] : []),
              ...(roomCount ? [{ type: "text", text: `จำนวนห้อง: ${roomCount}`, wrap: true }] : []),

              ...(checkIn ? [{ type: "text", text: `เช็คอิน: ${checkIn}`, wrap: true }] : []),
              ...(checkOut ? [{ type: "text", text: `เช็คเอาท์: ${checkOut}`, wrap: true }] : []),
              ...(nights ? [{ type: "text", text: `จำนวนคืน: ${nights}`, wrap: true }] : []),

              ...(petType ? [{ type: "text", text: `สัตว์เลี้ยง: ${petType}`, wrap: true }] : []),
              ...(petCount ? [{ type: "text", text: `จำนวนสัตว์เลี้ยง: ${petCount}`, wrap: true }] : []),

              ...(phone ? [{ type: "text", text: `โทร: ${phone}`, wrap: true }] : []),
              ...(userId ? [{ type: "text", text: `userId: ${userId}`, wrap: true, size: "xs", color: "#999999" }] : []),
            ],
          },
        },
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
