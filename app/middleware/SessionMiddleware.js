const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid'); // برای تولید شناسه منحصر به فرد (UUID)

module.exports = function (socket, next) {

    // console.log(socket.headers.cookie)
    // const sid = socket.request.headers.cookie?.sid;
    // console.log(sid)
    const sid = socket.request.headers.cookie;
    console.log(",",socket.response)
    if(sid){

    }else{
        const newSid = uuidv4();
        socket.handshake.session = newSid;

        // res.cookie(
        //     'sid',
        //      newSid,
        //      { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true, path: '/' });
        // console.log(`New SID created: ${newSid}`);
    }

    // بررسی اینکه آیا کوکی sid وجود دارد یا خیر
    // const sid = req.cookies.sid;
    // console.log("Asdad")
    // if (sid) {
    //     req.sessionId = sid; // اگر موجود باشد، آن را برای استفاده ذخیره کن
    //     console.log(`Existing SID found: ${sid}`);
    // } else {
    //     // اگر نه، یک sid جدید بساز
    //     const newSid = uuidv4();
    //     req.sessionId = newSid;
    //     res.cookie(
    //         'sid',
    //          newSid,
    //          { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true, path: '/' });
    //     console.log(`New SID created: ${newSid}`);
    // }

    // next(); // ادامه درخواست
};
