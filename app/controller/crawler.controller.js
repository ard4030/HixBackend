const { default: axios } = require("axios");
const { SUCCESS, ERROR } = require("../utils/constants");
const cheerio = require('cheerio');
const { crawlProductPage, getUrlsMultiSitemap, getAllProductUrlsFromSitemaps, getProductsDataCrawler } = require("../utils/functions");

class CrawlerController{

    // تابع برای دریافت و پردازش سایت‌مپ
    async crawlSitemap(req,res,next) {
        try {
            const { url } = req.body;
            
            // ارسال درخواست به سایت‌مپ
            const response = await axios.get(url);
            console.log(response)
            const $ = cheerio.load(response.data);
            const urls = [];

            // استخراج لینک‌ها از سایت‌مپ (فرض بر این است که سایت‌مپ XML است)
            $('sitemap loc').each((i, element) => {
                const url = $(element).text();
                urls.push(url);
            });

            return res.status(SUCCESS).json({
                success:true,
                data:urls,
            })

        } catch (error) {
            return res.status(500).json({
                success:false,
                message:error.message
            })

        }
    }

    async crowlSingleProduct(req,res,next){
        try {
            const { productUrl } = req.body;
            console.log(productUrl)
            const productInfo = await crawlProductPage(productUrl);

            return res.status(SUCCESS).json({
                success:true,
                data:productInfo
            })
        } catch (error) {
            return res.status(ERROR).json({
                success:false,
                message:error.message
            })
        }
    }

    async crowlAllProducts(req,res,next){
        try {
            const { 
                sitemap,
                titleSelector,
                categorySelector,
                descriptionSelector,
                imageSelector,
                priceSelector,
                descountSelector,
                baseUrlImage,
                multiSitemap,
                sitemapFormat,
                productMapFormatt,
                mySiteMaps,
                limit,
                limitTimeRequest
             } = req.body;

            //  If Multi Site Map
             let sitemaps = [];
             let productsUrl = [];
             let productsData = [];
             if(multiSitemap){
                if(mySiteMaps && mySiteMaps.length>0){
                    productsUrl = await getAllProductUrlsFromSitemaps(mySiteMaps,productMapFormatt);
                    productsData = await getProductsDataCrawler(productsUrl,titleSelector,categorySelector,descriptionSelector,imageSelector,priceSelector,baseUrlImage,limit,limitTimeRequest)
                }else{
                   
                    sitemaps = await getUrlsMultiSitemap(sitemap,sitemapFormat);
                    productsUrl = await getAllProductUrlsFromSitemaps(sitemaps,productMapFormatt);
                    productsData = await getProductsDataCrawler(productsUrl,titleSelector,categorySelector,descriptionSelector,imageSelector,priceSelector,baseUrlImage,limit,limitTimeRequest)
                }
                
             }else {
                
                productsUrl = await getAllProductUrlsFromSitemaps([sitemap],productMapFormatt);
                productsData = await getProductsDataCrawler(productsUrl,titleSelector,categorySelector,descriptionSelector,imageSelector,priceSelector,baseUrlImage,limit,limitTimeRequest)
             }
            

            // const productInfo = await crawlProductPage(productUrl);

            return res.status(SUCCESS).json({
                success:true,
                data:productsData
            })
        } catch (error) {
            return res.status(ERROR).json({
                success:false,
                message:error.message
            })
        }
    }

    // URL صفحه محصول را وارد کنید
    // const productUrl = 'https://example.com/product/12345';  // URL صفحه محصول
    // crawlProductPage(productUrl).then(productInfo => {
    //     // استفاده از اطلاعات استخراج شده
    //     console.log('Product Info:', productInfo);
    // });
}

module.exports = {
    CrawlerController : new CrawlerController()
}