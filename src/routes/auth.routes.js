import express from 'express';
import {rateLimit} from '../middleware/rateLimiter.middleware.js'
import {UserRegister,UserLogin,UserLogout,RefreshAccessToken} from '../controller/auth.controller.js'


const router =express.Router();

router.post("/register",rateLimit(15 * 60_000, 10),UserRegister);
router.post("/login",rateLimit(15 * 60_000, 10),UserLogin);
router.post("/logout",UserLogout);
router.post("/refresh",RefreshAccessToken)

export default router;