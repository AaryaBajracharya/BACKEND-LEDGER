import accountModel from '../models/account.model.js'

const createAccountController = async (req, res) =>{

    const user  =req.user
    const account =await accountModel.create({

        userId: user.id
    
    })

    res.status(201).json({
        account
    })

}

const getUserAccountController =async (req,res) =>{

    const account =await accountModel.findAll({
        where:{
            userId :req.user.id}
        })

        res.status(200).json({
        account})

}

const getUserBalanceController = async (req,res) =>{
    const {accountId} =req.params
    const account = await accountModel.findOne({
        where : {id : accountId ,userId : req.user.id}
    })

    if (!account){
        return res.status(404).json({
            message: "Account not found"
        })
    }

    const balance = await account.getBalance();

    res.status(200).json({
        accountId: account.id,
        balance :balance
    })

}
export {createAccountController,getUserAccountController,getUserBalanceController}