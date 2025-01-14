const multer = require('multer');

// تنظیمات multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // حداکثر اندازه فایل 10MB
}).single('file'); // نام فیلد در فرم

module.exports = {
    upload
}