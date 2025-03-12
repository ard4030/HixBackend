const OpenAI  = require("openai");
const { ProductModel } = require("../model/ProductModel");
const { OptionModel } = require("../model/Option");
const { setCache } = require("../utils/functions");

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
            // this.contentAi += JSON.stringify(products);

            // return {
            //     success:true,
            //     type:"text",
            //     message:"اروررینممم",
            //     data:[],
            // } 

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

                     // استخراج تعداد توکن‌های مصرفی از پاسخ
                    const usage = completion.usage;
                    console.log("Tokens used:", usage); // نمایش تعداد توکن‌های مصرفی در کنسول

                    response = completion.choices[0].message.content;
                } catch (error) {
                    // console.error("Error with OpenAI API:", error);
                    response = {
                        type:'text',
                        message:"متاسفانه مشکلی پیش آمد. لطفا دوباره تلاش کنید.",
                        data:[],
                        success:false,
                        errorText:error.message
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
                data:[],
                errorText:error.message
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
