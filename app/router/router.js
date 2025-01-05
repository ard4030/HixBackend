const { OperatorController } = require("../controller/operator.controller");
const { OptionController } = require("../controller/option.controller");
const { PlanController } = require("../controller/plan.controller");
const { PreparedMessages } = require("../controller/preparedMessages.controller");
const { ProductController } = require("../controller/product.controller");
const { UserController } = require("../controller/user.controller");
const { CheckAccess } = require("../middleware/CheckAccess");
const { VerifyAuth } = require("../middleware/VerifyAccessToken");

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

// Operator
router.post("/operator/add",VerifyAuth,CheckAccess(['ADD_OPERATOR']),OperatorController.addOperator)
router.post("/operator/login",OperatorController.loginOperator)

// Option
router.post("/option/update",VerifyAuth,CheckAccess(['USER']),OptionController.addOption)
router.get("/option/getOptions",VerifyAuth,CheckAccess(['USER']),OptionController.getAllOptions)
router.post("/option/saveOptions",VerifyAuth,CheckAccess(['USER']),OptionController.saveOptions)

// Products
router.post("/product/add",VerifyAuth,CheckAccess(['PRODUCT']),ProductController.addProducts)
router.post("/product/getByMerchantId",ProductController.getProductsByMerchantId)
router.post("/product/addsingleproduct",VerifyAuth,CheckAccess(['PRODUCT']),ProductController.addSingleProduct)

// PreparedMessages
router.post("/questions/add",VerifyAuth,CheckAccess(['OPERATOR','USER']),PreparedMessages.addQuestion)
router.post("/questions/delete",VerifyAuth,CheckAccess(['OPERATOR','USER']),PreparedMessages.deleteQuestion)
router.post("/questions/update",VerifyAuth,CheckAccess(['OPERATOR','USER']),PreparedMessages.updateQuestion)
router.get("/questions/get",VerifyAuth,CheckAccess(['OPERATOR','USER']),PreparedMessages.getQuestions)



module.exports = {
    AllRoutes : router
}