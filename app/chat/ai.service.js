const OpenAI  = require("openai");
const { ProductModel } = require("../model/ProductModel");
const { OptionModel } = require("../model/Option");

module.exports = class AI {
    merchantId = null;
    openai = null;
    contentAi = "";  

    constructor(merchantId) {
        this.merchantId = merchantId;
        
        // this.getProducts(merchantId)
        this.openai = new OpenAI({
            apiKey: process.env.AI_APIKEY,
        });

    }

    // متد برای ارسال پیام به OpenAI و دریافت پاسخ
    async respondToMessage(message) {
        try {
            
            let response = {};
            let type = "text";
            let data = [];

            const products = await ProductModel.find({merchantId:this.merchantId})
            // const options = {language:"فارسی"}
            const options = await OptionModel.findOne({merchantId:this.merchantId});
            this.contentAi = options.options.contentAi;
            this.contentAi += JSON.stringify(products);
            // console.log(this.contentAi)

            // let finallMessage = `سلام لطفا سوالاتی که میپرسم رو فقط و فقط بر اساس دیتای من جواب بده`
            // finallMessage += `دیتای من این هست ${JSON.stringify(products)} `
            // finallMessage += `اگه سوال بی ربط بود بگو نمیتونی پاسخ بدی`
            // finallMessage += `اگه میخوای لیست محصولات رو نشون بدی فیلتر کن و درقالب یک آرایه برگردون بدون متن اضافی`
            // finallMessage += `و در اخر این ${options} برای پاسخگویی در نظر بگیر. سوال من اینه  `
            // finallMessage += message

            // console.log(finallMessage)

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
                                // content: "شما یک دستیار هوشمند فروشگاه هستید که می‌تواند به مشتریان کمک کند."
                                content: this.contentAi,
                            },
                            {
                                role: "user",
                                content: message
                            }
                        ],
                    });


                    response = completion.choices[0].message.content;
                } catch (error) {
                    // console.error("Error with OpenAI API:", error);
                    response = {
                        type:'text',
                        message:"متاسفانه مشکلی پیش آمد. لطفا دوباره تلاش کنید.",
                        data:[],
                        success:false
                    }
                    return response
                }
            }

            const regex = /^[\{\}]/;
            if(regex.test(response)){
                return JSON.parse(response)
            }else{
                return {type:"text",message:response,data:[]}
            }
            
        } catch (error) {
            return {
                success:false,
                type:"text",
                message:"مشکلی پیش آمده",
                data:[]
            } 
        }
        
        
    }

    // async getProducts(mtid){
    //     const products = await ProductModel.find({merchantId:mtid})
    //     console.log(products)
    //     this.products = products
    // }

    async getOptions(mtid){

    }
}
