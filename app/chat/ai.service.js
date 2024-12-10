const OpenAI  = require("openai");
const { ProductModel } = require("../model/ProductModel");

module.exports = class AI {
    merchantId = null;
    openai = null;  

    constructor(merchantId) {
        this.merchantId = merchantId;
        
        // this.getProducts(merchantId)
        this.openai = new OpenAI({
            apiKey: process.env.AI_APIKEY,
        });


        // // داده‌های محصولات
        // this.products = [
        //     {
        //         "name": "iPhone 15 Pro",
        //         "price": 14000000,
        //         "category": "Smartphone",
        //         "image_url": "https://example.com/iphone_15_pro.jpg"
        //     },
        //     {
        //         "name": "Samsung Galaxy S23",
        //         "price": 12000000,
        //         "category": "Smartphone",
        //         "image_url": "https://example.com/galaxy_s23.jpg"
        //     },
        //     {
        //         "name": "Xiaomi 13 Pro",
        //         "price": 11000000,
        //         "category": "Smartphone",
        //         "image_url": "https://example.com/xiaomi_13_pro.jpg"
        //     },
        //     {
        //         "name": "OnePlus 11",
        //         "price": 9500000,
        //         "category": "Smartphone",
        //         "image_url": "https://example.com/oneplus_11.jpg"
        //     },
        //     {
        //         "name": "Google Pixel 8",
        //         "price": 11500000,
        //         "category": "Smartphone",
        //         "image_url": "https://example.com/pixel_8.jpg"
        //     },
        //     {
        //         "name": "iPhone 14",
        //         "price": 12000000,
        //         "category": "Smartphone",
        //         "image_url": "https://example.com/iphone_14.jpg"
        //     },
        //     {
        //         "name": "Huawei P60 Pro",
        //         "price": 10000000,
        //         "category": "Smartphone",
        //         "image_url": "https://example.com/huawei_p60_pro.jpg"
        //     },
        //     {
        //         "name": "Sony Xperia 1 IV",
        //         "price": 13000000,
        //         "category": "Smartphone",
        //         "image_url": "https://example.com/sony_xperia_1_iv.jpg"
        //     },
        //     {
        //         "name": "Oppo Find X6 Pro",
        //         "price": 11500000,
        //         "category": "Smartphone",
        //         "image_url": "https://example.com/oppo_find_x6_pro.jpg"
        //     },
        //     {
        //         "name": "Motorola Edge 30 Ultra",
        //         "price": 9500000,
        //         "category": "Smartphone",
        //         "image_url": "https://example.com/motorola_edge_30_ultra.jpg"
        //     }
        // ];
    }

    // متد برای ارسال پیام به OpenAI و دریافت پاسخ
    async respondToMessage(message) {
        let response = '';
        let type = "text";
        let data = [];

        const products = await ProductModel.find({merchantId:this.merchantId})
        const options = {language:"فارسی"}

        let finallMessage = `سلام لطفا سوالاتی که میپرسم رو فقط و فقط بر اساس دیتای من جواب بده`
        finallMessage += `دیتای من این هست ${JSON.stringify(products)} `
        finallMessage += `اگه سوال بی ربط بود بگو نمیتونی پاسخ بدی`
        finallMessage += `و در اخر این ${options} برای پاسخگویی در نظر بگیر. سوال من اینه  `
        finallMessage += message

        console.log(finallMessage)

        // بررسی اینکه آیا پیام شامل کلمات خاصی است
        if (message.includes('گوشی') || message.includes('قیمت')) {
            response = 'در اینجا برخی از محصولات ما هستند: \n';
            data = this.products;
            type = "slider"
            // this.products.forEach(product => {
            //     response += `${product.name} - قیمت: ${product.price} تومان \n`;
            // });
        } else {
            // درخواست به OpenAI برای پردازش پیام
            try {
                const completion = await this.openai.chat.completions.create({
                    model: "gpt-4", // استفاده از مدل GPT-4 (می‌توانید مدل‌های دیگر را هم استفاده کنید)
                    messages: [
                        {
                            role: "system",
                            content: "شما یک دستیار هوشمند فروشگاه هستید که می‌تواند به مشتریان کمک کند."
                        },
                        {
                            role: "user",
                            content: finallMessage
                        }
                    ],
                });


                response = completion.choices[0].message.content;
            } catch (error) {
                console.error("Error with OpenAI API:", error);
                response = "متاسفانه مشکلی پیش آمد. لطفا دوباره تلاش کنید.";
            }
        }

        return {
            message:response,type,data};
    }

    // async getProducts(mtid){
    //     const products = await ProductModel.find({merchantId:mtid})
    //     console.log(products)
    //     this.products = products
    // }

    async getOptions(mtid){

    }
}
