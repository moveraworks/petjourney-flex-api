export default async function handler(req, res) {
  // ---- CORS ----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const hotel = req.query.hotel || "";
    const area = req.query.area || "";

    // ตัวอย่าง response เดิมของคุณ (คงไว้ได้เลย)
    return res.status(200).json({
      ok: true,
      hotel,
      area,
      flex: {
        type: "flex",
        altText: `จอง: ${hotel}`,
        contents: {
          type: "bubble",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "Pet Journey Booking", weight: "bold", size: "lg" },
              { type: "text", text: `โรงแรม: ${hotel}`, wrap: true },
              { type: "text", text: `พื้นที่: ${area}`, wrap: true }
            ]
          }
        }
      }
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
