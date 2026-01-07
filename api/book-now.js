export default function handler(req, res) {
  const { hotel = "Unknown", area = "Unknown" } = req.query;

  const flex = {
    type: "flex",
    altText: `จอง: ${hotel}`,
    contents: {
      type: "bubble",
      hero: {
        type: "image",
        url: "https://placehold.co/1024x576/png?text=Pet+Journey",
        size: "full",
        aspectRatio: "16:9",
        aspectMode: "cover"
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          { type: "text", text: "Pet Journey Booking", weight: "bold", size: "lg" },
          { type: "text", text: `โรงแรม: ${hotel}`, wrap: true },
          { type: "text", text: `พื้นที่: ${area}`, wrap: true }
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
              type: "uri",
              label: "ทักแอดมินเพื่อจอง",
              uri: "https://line.me/R/oaMessage/@YOUR_OA_ID/?สนใจจอง%20" + encodeURIComponent(hotel)
            }
          }
        ]
      }
    }
  };

  // ตอนนี้ยัง "คืนค่า flex" ออกไปก่อน เพื่อเช็คหน้าตา
  res.status(200).json({ ok: true, hotel, area, flex });
}
