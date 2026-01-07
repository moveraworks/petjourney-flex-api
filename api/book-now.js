export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: "Pet Journey Booking API is live"
  });
}
