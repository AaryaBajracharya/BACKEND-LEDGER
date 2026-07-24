import accountModel from '../models/account.model.js'
import { catchAsync } from '../middleware/error.middleware.js'
import { AppError, NotFoundError } from '../errors/index.js'

const createAccountController = catchAsync(async (req, res) =>{

    const user  =req.user
    const account =await accountModel.create({

        userId: user.id
    
    })

    res.status(AppError.CREATED).json({
        account
    })

});

const getUserAccountController =catchAsync(async (req,res) =>{

    const account =await accountModel.findAll({
        where:{
            userId :req.user.id}
        })

    if (!account){
        throw new NotFoundError("Account not found")
    }

    res.status(AppError.OK).json({
    account})

});

const getUserBalanceController = catchAsync(async (req,res) =>{
    const {accountId} =req.params
    const account = await accountModel.findOne({
        where : {id : accountId ,userId : req.user.id}
    })

    if (!account){
       throw new NotFoundError("Account not found")
    }

    const balance = await account.getBalance();

    res.status(AppError.OK).json({
        accountId: account.id,
        balance :balance
    })

});
export {createAccountController,getUserAccountController,getUserBalanceController}