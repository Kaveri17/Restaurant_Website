import express from "express"
import { isAuthenticated } from "../middlewares/isAuthenticated"
import { createCheckoutSession, getOrders } from "../controllers/order.controller"

const router = express.Router()

router.route("/").get(isAuthenticated,getOrders)
router.route("/checkout/create-checkout-session").post(isAuthenticated, createCheckoutSession);
// router.route("/webhook").post();

export default router