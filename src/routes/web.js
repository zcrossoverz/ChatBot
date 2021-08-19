import express from "express";
import chatbotControllers from "../controllers/chatbotControllers";

let router = express.Router();
let initWebRoutes = (app)=>{
    router.get('/',chatbotControllers.getHomePage);
    router.get('/webhook',chatbotControllers.getWebHook);
    router.post('/webhook',chatbotControllers.postWebHook);
    return app.use('/',router);
}
module.exports = initWebRoutes;