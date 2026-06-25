import userModel from '../models/user.model.js';
import jwt from  'jsonwebtoken';


const authMiddleware = async (req, res ,next ) => {

    console.log('cookies:', req.cookies);
    console.log('auth header:', req.headers.authorization);

    const token =req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token ){
        return res.status(401).json({
            message:"Unauthorized Access, token is missing"
        })
    }

    try{

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findByPk(decoded.userId)
        req.user =user
        return next()

    }catch(err)
    {   
        return res.status(401).json({
            message:"Unathorized access, token is invalid"
        })
    }

}

export {authMiddleware}