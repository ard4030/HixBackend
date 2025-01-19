const { OperatorController } = require("../controller/operator.controller");
const { OptionController } = require("../controller/option.controller");
const { PlanController } = require("../controller/plan.controller");
const { PreparedMessages } = require("../controller/preparedMessages.controller");
const { ProductController } = require("../controller/product.controller");
const { UserController } = require("../controller/user.controller");
const { CrawlerController } = require("../controller/crawler.controller");
const { CheckAccess } = require("../middleware/CheckAccess");
const { VerifyAuth } = require("../middleware/VerifyAccessToken");
const { UploadController } = require("../controller/upload.controller");
const { upload } = require("../middleware/multer");
const { ChatController } = require("../controller/chat.controller");

const router = require("express").Router();

// User 
router.post("/user/addUser",UserController.addUser) 
router.post("/user/login",UserController.login) 
router.get("/user/logout",UserController.logOut) 
router.get("/user/checkLogin",VerifyAuth,UserController.checkLogin) 
router.post("/user/setPlan",VerifyAuth,UserController.setUserPlan)
router.get("/user/getoperators",VerifyAuth,UserController.getOperators)

// Plan
router.post("/plan/add",VerifyAuth,CheckAccess(['SUPER_ADMIN']),PlanController.addPlan)
router.get("/plan/get",VerifyAuth,PlanController.getPlans)
router.post("/plan/setPlan",VerifyAuth,PlanController.setPlan)

// Uplaod
router.post("/upload/single",VerifyAuth,upload,UploadController.fileUpload)

// Operator
router.post("/operator/add",VerifyAuth,CheckAccess(['USER']),OperatorController.addOperator)
router.post("/operator/login",OperatorController.loginOperator)

// Option
router.post("/option/update",VerifyAuth,CheckAccess(['USER']),OptionController.addOption)
router.get("/option/getOptions",VerifyAuth,CheckAccess(['USER']),OptionController.getAllOptions)
router.post("/option/saveOptions",VerifyAuth,CheckAccess(['USER']),OptionController.saveOptions)

// Products
router.post("/product/add",VerifyAuth,CheckAccess(['USER']),ProductController.addProducts)
router.post("/product/getByMerchantId",ProductController.getProductsByMerchantId)
router.post("/product/addsingleproduct",VerifyAuth,CheckAccess(['USER']),ProductController.addSingleProduct)

// PreparedMessages
router.post("/questions/add",VerifyAuth,CheckAccess(['OPERATOR','USER']),PreparedMessages.addQuestion)
router.post("/questions/delete",VerifyAuth,CheckAccess(['OPERATOR','USER']),PreparedMessages.deleteQuestion)
router.post("/questions/update",VerifyAuth,CheckAccess(['OPERATOR','USER']),PreparedMessages.updateQuestion)
router.get("/questions/get",VerifyAuth,CheckAccess(['OPERATOR','USER']),PreparedMessages.getQuestions)

// Crawler
router.post("/crawler/crawl",CrawlerController.crawlSitemap)
router.post("/crawler/crawlSingle",CrawlerController.crowlSingleProduct)
router.post("/crawler/crowlAllProducts",CrawlerController.crowlAllProducts)

// Chats
router.post("/chat/getAll",VerifyAuth,CheckAccess(['USER','OPERATOR']),ChatController.getChatsByMerchant)


module.exports = {
    AllRoutes : router
}