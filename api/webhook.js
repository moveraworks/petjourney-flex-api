// api/webhook.js
const crypto = require("crypto");

const TTL_MS = 15 * 60 * 1000; // 15 min
const stateStore = new Map();

function now() {
  return Date.now();
}

function cleanupTTL() {
  const t = now();
  for (const [k, v] of stateStore.entries()) {
    if (t - v.updatedAt > TTL_MS) stateStore.delete(k);
  }
}

function setState(userId, patch) {
  cleanupTTL();
  const prev = stateStore.get(userId) || { step: 1 };
  const next = {
    ...prev,
    ...patch,
    updatedAt: now(),
  };
  stateStore.set(userId, next);
  return next;
}

function getState(userId) {
  cleanupTTL();
  return stateStore.get(userId);
}

function parsePostbackData(dataStr) {
  const params = new URLSearchParams(dataStr);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function verifyLineSignature(rawBody, signature) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) throw new Error("Missing LINE_CHANNEL_SECRET");
  if (!signature) return false;

  const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function lineReply(replyToken, messages) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("Missing LINE_CHANNEL_ACCESS_TOKEN");

  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
}

async function linePush(to, messages) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("Missing LINE_CHANNEL_ACCESS_TOKEN");

  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to, messages }),
  });
}

/** ---------- labels ---------- */
function serviceLabel(s) {
  if (s === "BOARDING") return "ฝากเลี้ยง";
  if (s === "TRANSPORT") return "รับ–ส่งสัตว์เลี้ยง";
  if (s === "VET") return "พาไปหาหมอ";
  return "-";
}
function roomLabel(r) {
  if (r === "STANDARD") return "Standard";
  if (r === "DELUXE") return "Deluxe";
  if (r === "VIP") return "VIP";
  return "-";
}
function petLabel(t) {
  if (t === "DOG") return "สุนัข";
  if (t === "CAT") return "แมว";
  if (t === "OTHER") return "อื่นๆ";
  return "-";
}

/** ---------- FLEX ---------- */
function flexChooseService() {
  return {
    type: "flex",
    altText: "เริ่มจองบริการ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: "🐾 Pet Journey", weight: "bold", size: "lg" },
          { type: "text", text: "เลือกบริการที่ต้องการ", size: "sm", color: "#666666" },
          { type: "button", style: "primary", action: { type: "postback", label: "ฝากเลี้ยง", data: "ACTION=SERVICE&SERVICE=BOARDING" } },
          { type: "button", action: { type: "postback", label: "รับ–ส่งสัตว์เลี้ยง", data: "ACTION=SERVICE&SERVICE=TRANSPORT" } },
          { type: "button", action: { type: "postback", label: "พาไปหาหมอ", data: "ACTION=SERVICE&SERVICE=VET" } },
        ],
      },
    },
  };
}

function flexPickDate() {
  return {
    type: "flex",
    altText: "เลือกวันที่",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: "📅 เลือกวันที่", weight: "bold", size: "lg" },
          { type: "text", text: "กดปุ่มด้านล่างเพื่อเลือกวัน", size: "sm", color: "#666666" },
          {
            type: "button",
            style: "primary",
            action: { type: "datetimepicker", label: "เลือกวัน", mode: "date", data: "ACTION=DATE" },
          },
          { type: "button", action: { type: "postback", label: "เริ่มใหม่", data: "ACTION=RESET" } },
        ],
      },
    },
  };
}

function flexPickRoom() {
  return {
    type: "flex",
    altText: "เลือกประเภทห้องพัก",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: "🏠 เลือกประเภทห้องพัก", weight: "bold", size: "lg" },
          { type: "text", text: "เลือกห้องที่ต้องการ", size: "sm", color: "#666666" },
          { type: "button", style: "primary", action: { type: "postback", label: "Standard", data: "ACTION=ROOM&ROOM=STANDARD" } },
          { type: "button", action: { type: "postback", label: "Deluxe", data: "ACTION=ROOM&ROOM=DELUXE" } },
          { type: "button", action: { type: "postback", label: "VIP", data: "ACTION=ROOM&ROOM=VIP" } },
          { type: "button", action: { type: "postback", label: "เริ่มใหม่", data: "ACTION=RESET" } },
        ],
      },
    },
  };
}

function flexPickPet() {
  return {
    type: "flex",
    altText: "เลือกสัตว์และจำนวน",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: "🐶🐱 เลือกสัตว์เลี้ยง", weight: "bold", size: "lg" },
          { type: "text", text: "เลือกประเภทสัตว์", size: "sm", color: "#666666" },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              { type: "button", style: "primary", height: "sm", action: { type: "postback", label: "สุนัข", data: "ACTION=PETTYPE&PETTYPE=DOG" } },
              { type: "button", height: "sm", action: { type: "postback", label: "แมว", data: "ACTION=PETTYPE&PETTYPE=CAT" } },
              { type: "button", height: "sm", action: { type: "postback", label: "อื่นๆ", data: "ACTION=PETTYPE&PETTYPE=OTHER" } },
            ],
          },
          { type: "separator" },
          { type: "text", text: "เลือกจำนวน", size: "sm", color: "#666666" },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [1, 2, 3].map((n) => ({
              type: "button",
              height: "sm",
              action: { type: "postback", label: `${n} ตัว`, data: `ACTION=PETCOUNT&PETCOUNT=${n}` },
            })),
          },
          { type: "button", height: "sm", action: { type: "postback", label: "4+ ตัว", data: "ACTION=PETCOUNT&PETCOUNT=4" } },
        ],
      },
    },
  };
}

function flexSummary(st) {
  const rows = [
    ["บริการ", serviceLabel(st.service)],
    ["วันที่", st.date || "-"],
    ["ห้องพัก", roomLabel(st.room)],
    ["สัตว์เลี้ยง", `${petLabel(st.petType)} x ${st.petCount || "-"}`],
  ];

  return {
    type: "flex",
    altText: "สรุปการจอง",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          { type: "text", text: "✅ สรุปการจอง", weight: "bold", size: "lg" },
          ...rows.map(([k, v]) => ({
            type: "box",
            layout: "baseline",
            spacing: "sm",
            contents: [
              { type: "text", text: k, size: "sm", color: "#666666", flex: 3 },
              { type: "text", text: v, size: "sm", wrap: true, flex: 7 },
            ],
          })),
          { type: "separator" },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              { type: "button", style: "primary", action: { type: "postback", label: "ยืนยัน", data: "ACTION=CONFIRM" } },
              { type: "button", action: { type: "postback", label: "ยกเลิก", data: "ACTION=CANCEL" } },
            ],
          },
        ],
      },
    },
  };
}

/** ---------- handler ---------- */
module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const rawBody = await readRawBody(req);
    const signature = req.headers["x-line-signature"];

    if (!verifyLineSignature(rawBody, signature)) {
      return res.status(401).send("Invalid signature");
    }

    const body = JSON.parse(rawBody.toString("utf8"));
    const events = body.events || [];
    if (!events.length) return res.status(200).json({ ok: true });

    for (const event of events) {
      const replyToken = event.replyToken;
      const userId = event.source && event.source.userId;
      if (!replyToken || !userId) continue;

      // -------- POSTBACK --------
      if (event.type === "postback") {
        const dataStr = event.postback && event.postback.data ? event.postback.data : "";
        const data = parsePostbackData(dataStr);
        const action = data.ACTION;

        // datetimepicker returns params.date
        const pickedDate = event.postback && event.postback.params ? event.postback.params.date : undefined;

        // BOOK NOW (Rich Menu)
        if (dataStr === "BOOK_NOW" || action === "BOOKNOW") {
          setState(userId, { step: 1, service: undefined, date: undefined, room: undefined, petType: undefined, petCount: undefined });
          await lineReply(replyToken, [flexChooseService()]);
          continue;
        }

        if (action === "RESET") {
          stateStore.delete(userId);
          await lineReply(replyToken, [{ type: "text", text: "เริ่มใหม่เรียบร้อย ✅" }, flexChooseService()]);
          continue;
        }

        if (action === "CANCEL") {
          stateStore.delete(userId);
          await lineReply(replyToken, [{ type: "text", text: "ยกเลิกเรียบร้อยครับ 🙏" }]);
          continue;
        }

        if (action === "SERVICE") {
          setState(userId, { step: 2, service: data.SERVICE });
          await lineReply(replyToken, [flexPickDate()]);
          continue;
        }

        if (action === "DATE") {
          if (!pickedDate) {
            await lineReply(replyToken, [{ type: "text", text: "ยังไม่ได้เลือกวัน ลองอีกครั้งนะครับ" }, flexPickDate()]);
            continue;
          }
          setState(userId, { step: 3, date: pickedDate });
          await lineReply(replyToken, [flexPickRoom()]);
          continue;
        }

        if (action === "ROOM") {
          setState(userId, { step: 4, room: data.ROOM });
          await lineReply(replyToken, [flexPickPet()]);
          continue;
        }

        if (action === "PETTYPE") {
          const st = getState(userId) || setState(userId, { step: 4 });
          setState(userId, { ...st, petType: data.PETTYPE, step: 4 });
          await lineReply(replyToken, [{ type: "text", text: `เลือกประเภท: ${petLabel(data.PETTYPE)}` }, flexPickPet()]);
          continue;
        }

        if (action === "PETCOUNT") {
          const st = getState(userId);
          if (!st || !st.petType) {
            await lineReply(replyToken, [{ type: "text", text: "ขอเลือกประเภทสัตว์ก่อนนะครับ" }, flexPickPet()]);
            continue;
          }
          const count = Number(data.PETCOUNT || "");
          if (!count || Number.isNaN(count)) {
            await lineReply(replyToken, [{ type: "text", text: "จำนวนไม่ถูกต้อง ลองใหม่ครับ" }, flexPickPet()]);
            continue;
          }
          const next = setState(userId, { step: 5, petCount: count });
          await lineReply(replyToken, [flexSummary(next)]);
          continue;
        }

        if (action === "CONFIRM") {
          const st = getState(userId);
          if (!st || !st.service || !st.date || !st.room || !st.petType || !st.petCount) {
            await lineReply(replyToken, [{ type: "text", text: "ข้อมูลยังไม่ครบครับ ขอเริ่มใหม่ 🙏" }, flexChooseService()]);
            stateStore.delete(userId);
            continue;
          }

          await lineReply(replyToken, [
            { type: "text", text: "รับเรื่องจองเรียบร้อย ✅ เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันอีกครั้งครับ" },
            flexSummary(st),
          ]);

          // optional notify admin
          const adminId = process.env.ADMIN_USER_ID;
          if (adminId) {
            await linePush(adminId, [
              {
                type: "text",
                text:
                  `📩 New Booking\n` +
                  `บริการ: ${serviceLabel(st.service)}\n` +
                  `วันที่: ${st.date}\n` +
                  `ห้อง: ${roomLabel(st.room)}\n` +
                  `สัตว์: ${petLabel(st.petType)} x ${st.petCount}`,
              },
            ]);
          }

          stateStore.delete(userId);
          continue;
        }

        // fallback
        await lineReply(replyToken, [{ type: "text", text: "ขอโทษครับ ระบบยังไม่รองรับปุ่มนี้" }]);
        continue;
      }

      // -------- MESSAGE -------- (ถ้ายังไม่ใช้ ให้ตอบช่วยแนะนำ)
      if (event.type === "message" && event.message && event.message.type === "text") {
        const text = (event.message.text || "").trim();
        if (text === "จอง" || /^book$/i.test(text)) {
          setState(userId, { step: 1 });
          await lineReply(replyToken, [flexChooseService()]);
          continue;
        }
        await lineReply(replyToken, [{ type: "text", text: "พิมพ์ “จอง” หรือกด BOOK NOW เพื่อเริ่มได้เลยครับ" }]);
        continue;
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    // ตอบ 200 กัน LINE ยิงซ้ำรัว
    return res.status(200).json({ ok: true });
  }
};
