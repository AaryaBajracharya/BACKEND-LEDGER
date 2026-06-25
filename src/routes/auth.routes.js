import express from 'express';
import {UserRegister,UserLogin} from '../controller/auth.controller.js'

const router =express.Router();

router.post("/register",UserRegister);
router.post("/login",UserLogin);

export default router;