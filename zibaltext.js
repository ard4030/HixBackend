import Zibal from './Zibal'; // فرض بر این است که کد شما در فایل 'Zibal.js' است.

const config = {
  merchant: 'your_merchant_id',
  callbackUrl: 'https://your-website.com/callback',
};

Zibal.init(config);


----------------------------------------
const amount = 5000; // مبلغ به ریال
const extras = {
  mobile: '09123456789',
  description: 'پرداخت بابت سفارش شماره 1234',
};

Zibal.request(amount, extras)
  .then(response => {
    console.log('Response:', response);
    // در اینجا می‌توانید اطلاعات دریافتی را پردازش کنید.
  })
  .catch(error => {
    console.error('Error:', error);
    // در اینجا می‌توانید خطا را مدیریت کنید.
  });
------------------------------------------
const trackId = 'received_track_id_from_request';

Zibal.verify(trackId)
  .then(response => {
    console.log('Verify Response:', response);
    // بررسی کنید که وضعیت پرداخت موفقیت‌آمیز است یا خیر
  })
  .catch(error => {
    console.error('Error:', error);
    // در اینجا می‌توانید خطا را مدیریت کنید.
  });
----------------------------------------
const trackId = 'received_track_id_from_request';
const paymentUrl = Zibal.startURL(trackId);
console.log('Payment URL:', paymentUrl);
-----------------------------------------
import Zibal from './Zibal';

const config = {
  merchant: 'your_merchant_id',
  callbackUrl: 'https://your-website.com/callback',
};

Zibal.init(config);

const amount = 5000;
const extras = {
  mobile: '09123456789',
  description: 'پرداخت بابت سفارش شماره 1234',
};

Zibal.request(amount, extras)
  .then(response => {
    console.log('Payment requested:', response);
    const trackId = response.trackId;
    const paymentUrl = Zibal.startURL(trackId);
    console.log('Redirect to payment:', paymentUrl);
  })
  .catch(error => {
    console.error('Error in payment request:', error);
  });

// بعد از تایید پرداخت، وضعیت آن را بررسی کنید.
const trackId = 'your_track_id';
Zibal.verify(trackId)
  .then(response => {
    console.log('Payment verified:', response);
  })
  .catch(error => {
    console.error('Error in payment verification:', error);
  });
