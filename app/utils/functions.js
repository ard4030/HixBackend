const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { S3Client, PutObjectCommand , GetObjectCommand  } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const moment = require('moment-jalaali');
const { default: axios } = require('axios');
const cheerio = require('cheerio');

// require('dotenv').config();

const hashPassword = async (pass) => {
    const hashPass = await bcrypt.hash(pass,10);
    return hashPass
}

const unhashPassword = async (hashPass,userPass) => {
    const compareResult = await bcrypt.compareSync(userPass,hashPass);
    return compareResult
}

const SignAccessToken = async (user) => {
    const payload = {
        username: user._id,
    };
    const option = {
        expiresIn : "2d"
    };
    const finallJWT = await jwt.sign(payload,process.env.ACCESS_TOKEN_SECRET_KEY,option)
    return finallJWT;
}

const verifyJwtToken = async (token) => {
    const result = await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET_KEY)
    console.log(result)
    // if(!result?.mobile) throw {status:401,message:"لطفا وارد شوید"}
    // return result
}

const generateApiKey = (length = 32) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let apiKey = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        apiKey += characters[randomIndex];
    }
    return apiKey;
}

const pushUnique = (arr, value) =>  {
    if (!arr.includes(value)) {
        arr.push(value);
    }
    return arr;
}

const getCookie = (name,cookies) => {
    const value = `; ${cookies}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

const generateUserChatToken = async (userData,sid) => {
    const payload = {
        userData,
        sid
    };
    const option = {
        expiresIn : "365d"
    };
    const finallJWT = await jwt.sign(payload,process.env.COOKIE_USER_CAHT_SECRET_KEY,option)
    return finallJWT;
}

const verifyUserChatToken = async (token) => {
    const decodedToken = jwt.decode(token);
    const currentTime = Math.floor(Date.now() / 1000); // زمان کنونی به ثانیه
    
    if (decodedToken.exp < currentTime) {
        return false
    }
    
    // در صورتی که توکن منقضی نشده باشد، اعتبارسنجی آن انجام می‌شود
    try {
        const result = await jwt.verify(token, process.env.COOKIE_USER_CAHT_SECRET_KEY);
        return result;
    } catch (err) {
        console.log(err)
        return false
    }
}

const getUserAndOperatorBySocketID = (list,socketID) => {
    for (const key in list) {
        for(const key1 in list[key]){
            if(list[key][key1]["id"] === socketID ){
                return list[key][key1]
            }
        }
    }
}

const getOperatorBySocketId = (list,socketID) => {
    for (const key in list) {
        for(const key1 in list[key]){

            if(key1 === socketID ){
                return list[key][key1]
            }
        }
    }
}

const getOperatorsByMerchantId = (operators,merchantId) => {
  let finallOperators = {}
  // پیمایش روی تمام کلیدهای آبجکت operators
  for (let key in operators) {
    // چک کردن اینکه merchantId در داخل این آبجکت برابر با merchantId مورد نظر هست یا نه
    if (key == merchantId) {
      // پیمایش روی هر کدام از کاربران داخل این merchantId
      for (let subKey in operators[key]) {
        // ایجاد ساختار جدید که شامل socketId و merchantId به عنوان فیلدهای داخل آبجکت باشد
        finallOperators[subKey] = {
          ...operators[key][subKey],
          socketId: subKey,   // اضافه کردن socketId به عنوان یک فیلد
          merchantId: key     // اضافه کردن merchantId به عنوان یک فیلد
        };
      }
    }
  }
  return finallOperators
}

const getUsersByMerchantId = (users,merchantId) => {
    let finallUsers = {}
    // پیمایش روی تمام کلیدهای آبجکت operators
    for (let key in users) {
      // چک کردن اینکه merchantId در داخل این آبجکت برابر با merchantId مورد نظر هست یا نه
      if (key == merchantId) {
        // پیمایش روی هر کدام از کاربران داخل این merchantId
        for (let subKey in users[key]) {
          // ایجاد ساختار جدید که شامل socketId و merchantId به عنوان فیلدهای داخل آبجکت باشد
          finallUsers[subKey] = {
            ...users[key][subKey],
            socketId: subKey,   // اضافه کردن socketId به عنوان یک فیلد
            merchantId: key     // اضافه کردن merchantId به عنوان یک فیلد
          };
        }
      }
    }
    return finallUsers
}

const getLockUser = (list,operatorSocketId) => {
    for (const key in list) {
        for(const key1 in list[key]){
            if(list[key][key1]["targetOperator"] === operatorSocketId ){
                return list[key][key1]
            }
        }
    }
}

const getFreeOperators = (operators,users,merchantId) => {
    let merchantsUsers = getUsersByMerchantId(users,merchantId)
    let merchantOperators = getOperatorsByMerchantId(operators,merchantId)

    // لیست اپراتور هایی که آزاد نیستند
    let socketIdsOperators = [];
    for(const key in merchantsUsers){
        if(merchantsUsers[key]["targetOperator"]){
            socketIdsOperators.push(merchantsUsers[key]["targetOperator"])
        }
    }

    // لیست اپراتور هایی که آزاد هستند
    let freeOperators = [];
    for(const key in merchantOperators){
        if(!socketIdsOperators.includes(merchantOperators[key]["socketId"])){
            freeOperators.push(merchantOperators[key])
            // return merchantOperators[key]["socketId"]
        }
    }

    return freeOperators?.[0]?.socketId;

}

const uploadFile = async (file) => {
    let str = file.name;
    let rename = str.replace(/\s+/g, ''); // حذف فضاهای اضافی از نام فایل
    let fileName = `${Date.now()}${rename}`;

    // ایجاد مسیر پوشه و اضافه کردن آن به نام فایل
    const folderPath = 'uploads/'; // پوشه‌ای که می‌خواهید فایل‌ها در آن ذخیره شوند
    const filePath = folderPath + fileName; // مسیر کامل فایل داخل پوشه

    // تبدیل Base64 به باینری
    const buffer = Buffer.from(file.data, 'base64');

    // تنظیمات اتصال به S3
    const client = new S3Client({
        region: "default",
        endpoint: process.env.LIARA_ENDPOINT,
        credentials: {
            accessKeyId: process.env.LIARA_ACCESS_KEY,
            secretAccessKey: process.env.LIARA_SECRET_KEY
        },
    });

    // تنظیمات پارامترهای درخواست برای آپلود فایل
    const params = {
        Body: buffer,
        Bucket: process.env.LIARA_BUCKET_NAME,
        Key: filePath, // ذخیره فایل در مسیر پوشه تعیین شده
        ContentType: file.type,
    };

    // آپلود فایل به S3
    const result = await client.send(new PutObjectCommand(params));

    // برگشت نام فایل به عنوان نتیجه
    return filePath;
}

const uploadVoice = async (file) => {
    // let str = file.name;
    // let rename = str.replace(/\s+/g, '_'); // استفاده از _ به جای فضای خالی
    let fileName = `${Date.now()}`;

    // مسیر پوشه
    const folderPath = 'uploads/';
    const filePath = folderPath + fileName;

    // اگر داده به صورت Blob است، نیازی به تبدیل به Base64 نیست.
    const buffer = await file.arrayBuffer(); // تبدیل Blob به ArrayBuffer
    const bufferData = Buffer.from(buffer); // تبدیل ArrayBuffer به Buffer

    // تنظیمات S3
    const client = new S3Client({
        region: "default",
        endpoint: process.env.LIARA_ENDPOINT || 'https://s3.us-west-1.amazonaws.com', // قرار دادن مقدار پیش‌فرض
        credentials: {
            accessKeyId: process.env.LIARA_ACCESS_KEY,
            secretAccessKey: process.env.LIARA_SECRET_KEY,
        },
    });

    // تنظیمات پارامترهای درخواست برای آپلود
    const params = {
        Body: bufferData, // ارسال داده‌های Blob به صورت Buffer
        Bucket: process.env.LIARA_BUCKET_NAME,
        Key: filePath, // مسیر کامل برای ذخیره
    };

    // آپلود فایل به S3
    const result = await client.send(new PutObjectCommand(params));

    // بازگشت نام فایل
    return filePath;

};

const getFileLink = async (fileName) => {

    const client = new S3Client({
        region: "default",
        endpoint: process.env.LIARA_ENDPOINT,
        credentials: {
            accessKeyId: process.env.LIARA_ACCESS_KEY,
            secretAccessKey: process.env.LIARA_SECRET_KEY
        },
    });

    const command = new GetObjectCommand({
        Bucket: process.env.LIARA_BUCKET_NAME,
        Key: fileName,
    }); 

    const url = await getSignedUrl(client, command);
    return url;
    // getSignedUrl(client, command).then((url) => {
    //     console.log("--------",url)
    //     return url;
    // })
}

const getLastMessage = (lastMessage) => {
    if(lastMessage?.type){
        switch (lastMessage.type) {
            case "text":
                return lastMessage.content
            case "slider":
                return "لیست محصولات"
            case "image/jpeg":    
                return "عکس"
            case "application/x-zip-compressed": 
                return "فایل"   
            case "video/mp4":    
                return "ویدیو"
            case "application/pdf":  
                return "سند"  
            default:
                return "پشتیبانی نمیشه";
        }
    }else{
        return "پشتیبانی نمیشه";
    }
    
}

const convertMillisToJalali = (millis) => {
    // تبدیل میلی‌ثانیه به تاریخ میلادی با moment
    const date = moment(millis);

    // فرمت کردن تاریخ به شمسی
    const jDate = date.format('jYYYY/jMM/jDD');

    // دریافت روز، ماه و سال
    const jYear = date.jYear();
    const jMonth = date.jMonth() + 1; // ماه شمسی از صفر شروع می‌شود
    const jDay = date.jDate();

    // نام ماه شمسی
    const monthName = getMonthName(jMonth);

    // ساعت و دقیقه با فرمت 12 ساعته و AM/PM
    const jHour = date.format('hh'); // ساعت به فرمت 12 ساعته
    const jMinute = date.format('mm'); // دقیقه
    const ampm = date.format('A'); // AM یا PM

    // برگشت دادن تاریخ شمسی به همراه ساعت و دقیقه و AM/PM
    return {
        year: jYear,
        month: jMonth,
        day: jDay,
        monthName: monthName,
        hour: jHour,
        minute: jMinute,
        ampm: ampm, // AM یا PM
        formattedDate: jDate,  // تاریخ شمسی به فرمت 'jYYYY/jMM/jDD'
    };
}

const getMonthName = (month) => {
    switch (month) {
        case 1: return "فروردین";
        case 2: return "اردیبهشت";
        case 3: return "خرداد";
        case 4: return "تیر";
        case 5: return "مرداد";
        case 6: return "شهریور";
        case 7: return "مهر";
        case 8: return "آبان";
        case 9: return "آذر";
        case 10: return "دی";
        case 11: return "بهمن";
        case 12: return "اسفند";
        default: return "";
    }
}

// تابع برای کرال کردن اطلاعات صفحه محصول
const crawlProductPage = async (productUrl) => {
        try {
            // ارسال درخواست به صفحه محصول
            const { data } = await axios.get(productUrl);

            // بارگذاری داده‌های HTML با cheerio
            const $ = cheerio.load(data);

            // استخراج اطلاعات محصول
            const title = $('h1.pdp-title-fa').text().trim();  // عنوان محصول
            const price = $('span.actual-price').text().trim();       // قیمت محصول
            const description = $('h2.pdp-title-en').text().trim(); // توضیحات محصول
            const image = $('div.sample-big-image-pdp img').attr('src');

            // چاپ اطلاعات استخراج شده
            console.log('Title:', title);
            console.log('Price:', price);
            console.log('Description:', description);

            // برگرداندن اطلاعات به صورت شیء
            return {
                title,
                price,
                description,
                image,
            };
        } catch (error) {
            console.error('Error fetching product page:', error);
        }
}

const getUrlsMultiSitemap = async (sitemap,format) => {
    const response = await axios.get(sitemap);
    
    const $ = cheerio.load(response.data);
    const urls = [];

    // استخراج لینک‌ها از سایت‌مپ (فرض بر این است که سایت‌مپ XML است)
    $(format).each((i, element) => {
        const url = $(element).text();
        urls.push(url);
    });

    return urls
}

const getAllProductUrlsFromSitemaps = async (sitemaps, format) => {
    let urls = [];
    
    // استفاده از map و Promise.all برای همزمان پردازش کردن تمام سابت‌مپ‌ها
    await Promise.all(sitemaps.map(async (element) => {
        const response = await axios.get(element);
        const $ = cheerio.load(response.data);
        
        // پردازش لینک‌ها
        $(format).each(async (i, element1) => {
            const url = $(element1).text();
            urls.push(url);
        });
    }));

    return urls;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getProductsDataCrawler = async (
    productsUrls,
    titleSelector,
    categorySelector,
    descriptionSelector,
    imageSelector,
    priceSelector,
    baseUrlImage,
    limit,
    limitTimeRequest
) => {
    try {
        let products = [];
        const limitimg = limit === 0 ? productsUrls.length:limit
        // productsUrls.length
        for (let i = 0; i < limitimg; i++) {
            const element = productsUrls[i];
            const { data } = await axios.get(element);
            const $ = cheerio.load(data);

            const title = $(titleSelector).text().trim();  // عنوان محصول
            const price = $(priceSelector).text().trim();       // قیمت محصول
            const description = $(descriptionSelector).text().trim(); // توضیحات محصول
            const image = $(imageSelector).attr('src');
            console.log(title)
            if (title) {
                products.push({
                    title,
                    price,
                    description,
                    image:baseUrlImage?`${baseUrlImage}${image}`:image,
                });
            }

            // اضافه کردن تاخیر بین درخواست‌ها
            await sleep(limitTimeRequest * 1000);  // مثلا 1 ثانیه
        }

        return products;
    } catch (error) {
        console.error('Error fetching product page:', error);
    }
};




module.exports = {
    hashPassword,unhashPassword,SignAccessToken,verifyJwtToken,
    generateApiKey,pushUnique,getCookie,generateUserChatToken,verifyUserChatToken,
    getUserAndOperatorBySocketID,getOperatorsByMerchantId,getUsersByMerchantId,uploadFile,
    getFileLink,getOperatorBySocketId,getLockUser,getFreeOperators,getLastMessage,
    convertMillisToJalali,uploadVoice,crawlProductPage,getUrlsMultiSitemap,getAllProductUrlsFromSitemaps,
    getProductsDataCrawler
}