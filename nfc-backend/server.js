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
  const { uid, mssv } = req.body;

  let student = null;
  let methodUsed = '';

  // 1. Trường hợp check-in bằng thẻ NFC (dựa vào UID)
  if (uid) {
    student = studentDatabase[uid];
    methodUsed = 'Thẻ NFC';
  } 
  // 2. Trường hợp check-in bằng MSSV nhập thủ công
  else if (mssv) {
    student = Object.values(studentDatabase).find(s => s.mssv === mssv);
    methodUsed = 'Nhập MSSV thủ công';
  }

  // Nếu không tìm thấy thông tin sinh viên
  if (!student) {
    return res.status(404).json({
      success: false,
      message: uid ? `Thẻ chưa đăng ký (UID: ${uid})` : `Mã số sinh viên ${mssv} không tồn tại!`
    });
  }

  // Lưu lịch sử điểm danh
  const logEntry = {
    uid: uid || 'N/A',
    mssv: student.mssv,
    fullName: student.fullName,
    method: methodUsed,
    timestamp: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  };

  checkinLogs.unshift(logEntry);
  console.log(`[CHECK-IN SUCCESS] ${logEntry.timestamp} - ${student.fullName} (${student.mssv}) qua ${methodUsed}`);

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

// Route kiểm tra trang chủ backend
app.get('/', (req, res) => {
  res.json({ success: true, message: "🚀 Backend NFC API đang hoạt động bình thường!" });
});

// Route phản hồi khi người dùng lỡ mở link /api/checkin bằng trình duyệt
app.get('/api/checkin', (req, res) => {
  res.json({ 
    success: false, 
    message: "Đường dẫn này chỉ tiếp nhận request dạng POST từ ứng dụng quét NFC." 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend API đang chạy tại http://localhost:${PORT}`);
});