const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    name:{type:String,default:""},
    faName:{type:String,default:""},
    conversations:{type:Number,default:0},//تعداد مکالمات هوشمند
    fileSize:{type:Number,default:""},//حجم فایل ارسالی
    operators:{type:Number,default:0},//تعداد اپراتور ها
    keepingConversationHistory:{type:Number,default:0},//نگهداری تاریخچه‌ ‌مکالمات
    reportsRobot:{type:Boolean,default:false},//گزارش عملکرد ربات
    widgetCustomization:{type:Boolean,default:false},//شخصی سازی ویجت
    apiAccess:{type:Boolean,default:false},//دسترسی به api
    telegramConnect:{type:Boolean,default:false},//قابلیت اتصال به تلگرام
    preparedMessages:{type:Boolean,default:false},//پیام های آماده شده
    showProducts:{type:Boolean,default:false},//نمایش محصولات* (ویترین ساز)
    removeHixAds:{type:Boolean,default:false},//امکان حذف متن تبلیغ هیکس
    blockingAnnoyingUsers:{type:Boolean,default:false},//مسدودسازی کاربران مزاحم
    voice:{type:Boolean,default:false},//ضبط و ارسال صدا
    excelReports:{type:Boolean,default:false},//خروجی اکسل از گزارشات و اطلاعات
    saveHistory:{type:Boolean,default:false},//نگهداری تاریخچه مکالمات
    whatsAppConnect:{type:Boolean,default:false},//قابلیت اتصال به واتساپ
    qualityControl:{type:Boolean,default:false},//کنترل کیفیت و رضایت مندی
    onlineUserDetails:{type:Boolean,default:false},//اطلاعات بازدید کنندگان حین گفتگو
    allTime:{type:Boolean,default:false},//امکان پاسخ گویی مکالمات در 24 ساعت شبانه روز (حتی روزهای تعطیل)
    webApp:{type:Boolean,default:false},//اپلیکیشن تحت وب
    simultaneousConversationWithUsers:{type:Boolean,default:false},//گفتوگو همزمان با کاربران
    customizationWidgetLogo:{type:Boolean,default:false},// شخصی سازی لوگو ویجت
    onlineUsersMonitoring:{type:Boolean,default:false},//مانیتورینگ لحظه ای بازدیدکنندگان
    educationWebinar:{type:Boolean,default:false},//وبینار رایگان آموزشی به همراه فایل های آماده
    officialInvoice:{type:Boolean,default:false},//امکان دانلود فاکتور رسمی
    websiteSeoHelp:{type:Boolean,default:false},//کمک به سئو وبسایت
    webhook:{type:Boolean,default:false},//وب هوک
    showCategorys:{type:Boolean,default:false},//نمایش دسته بندی های سایت
    comparison:{type:Boolean,default:false},//مقایسه 2 محصول انتخابی کاربران 
    discountAutoSend:{type:Boolean,default:false},//امکان ارسال خودکار کد تخفیف
    intelligentInteractionWithUsers:{type:Boolean,default:false},//تعامل هوشمند با کاربران
    advice:{type:Boolean,default:false},//مشاوره به کاربران با توجه به اطلاعات وبسایت
    keepingConversationHistory:{type:Number,default:0},//نگهداری تاریخچه‌ ‌مکالمات
},{
    timestamps:true
})

module.exports = {
    PlanModel : mongoose.model("plan",Schema)
}