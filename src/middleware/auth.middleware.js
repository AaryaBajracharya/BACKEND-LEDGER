import userModel from '../models/user.model.js';
import jwt from  'jsonwebtoken';
import tokenBlacklistModel from '../models/blacklist.model.js';


const authMiddleware = async (req, res ,next ) => {

    console.log('cookies:', req.cookies);
    console.log('auth header:', req.headers.authorization);

    const token =req.cookies.jwt_token || req.headers.authorization?.split(" ")[1]

    if(!token ){
        return res.status(401).json({
            message:"Unauthorized Access, token is missing"
        })
    }

    const isBlacklisted = await tokenBlacklistModel.findOne({where : {token}})
    if(isBlacklisted){
        return res.status(401).json({
            message:"Unauthorized Access, token is blacklisted"
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

const authSystemUserMiddleware = async(req, res, next ) => {

    const token =req.cookies.jwt_token || req.headers.authorization?.split(" ")[1]

      if(!token ){
        return res.status(401).json({
            message:"Unauthorized Access, token is missing"
        })
    }
    const isBlacklisted = await tokenBlacklistModel.findOne({where : {token}})

    if(isBlacklisted){
        return res.status(401).json({
            message:"Unauthorized Access, token is blacklisted"
        })
    }

    try{

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findByPk(decoded.userId, {
            attributes: {
                include: ['systemUser']}
            });

        if(!user.systemUser)
        {   
            return res.status(403).json({
                 message: "Forbidden access, not a system user"
            })
           
        }

        req.user =user
        return next()

    }catch(err)
    {   
        return res.status(401).json({
            message:"Unathorized access, token is invalid"
        })
    }


}
 
export {authMiddleware,authSystemUserMiddleware }