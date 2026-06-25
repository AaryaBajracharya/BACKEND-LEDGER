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

export {createAccountController}