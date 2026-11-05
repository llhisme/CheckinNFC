import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Cơ sở dữ liệu mẫu (In-memory) - Ánh xạ UID phần cứng -> MSSV + Họ tên
const studentDatabase = {
  "e3:cb:42:e3": { mssv: "2280619040", fullName: "Lâm Lý Hào" },
  "04:a1:b2:c3": { mssv: "2280619041", fullName: "Ngô Bích Hằng" }
};

// Lưu trữ lịch sử điểm danh
const checkinLogs = [];

/**
 * 1. API Điểm danh bằng UID thẻ
 * POST /api/checkin
 * Body: { "uid": "e3:cb:42:e3" }
 */
app.post('/api/checkin', (req, res) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ success: false, message: "Thiếu dữ liệu UID thẻ." });
  }

  // Tra cứu UID trong cơ sở dữ liệu
  const student = studentDatabase[uid];

  if (!student) {
    return res.status(404).json({
      success: false,
      message: `Thẻ chưa được đăng ký trong hệ thống! (UID: ${uid})`
    });
  }

  // Ghi lại thông tin check-in
  const logEntry = {
    uid,
    mssv: student.mssv,
    fullName: student.fullName,
    timestamp: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  };
  checkinLogs.unshift(logEntry); // Đưa bản ghi mới nhất lên đầu

  console.log(`[CHECK-IN SUCCESS] ${logEntry.timestamp} - ${student.fullName} (${student.mssv})`);

  return res.json({
    success: true,
    message: "Điểm danh thành công!",
    data: logEntry
  });
});

/**
 * 2. API Đăng ký liên kết thẻ mới
 * POST /api/register
 * Body: { "uid": "...", "mssv": "...", "fullName": "..." }
 */
app.post('/api/register', (req, res) => {
  const { uid, mssv, fullName } = req.body;

  if (!uid || !mssv || !fullName) {
    return res.status(400).json({ success: false, message: "Cần đủ thông tin UID, MSSV và Họ tên." });
  }

  studentDatabase[uid] = { mssv, fullName };

  return res.json({
    success: true,
    message: "Đã liên kết thẻ thành công!",
    data: studentDatabase[uid]
  });
});

/**
 * 3. API Lấy lịch sử điểm danh realtime
 * GET /api/checkins
 */
app.get('/api/checkins', (req, res) => {
  res.json({ success: true, total: checkinLogs.length, logs: checkinLogs });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend API đang chạy tại http://localhost:${PORT}`);
});