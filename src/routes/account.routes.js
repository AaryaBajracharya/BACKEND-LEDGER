import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createAccountController ,getUserAccountController ,getUserBalanceController} from '../controller/account.controller.js';

const router =express.Router();

router.post("/",authMiddleware,createAccountController);

router.get("/balance/:accountId",authMiddleware,getUserBalanceController);

router.get("/",authMiddleware,getUserAccountController);



export default router;