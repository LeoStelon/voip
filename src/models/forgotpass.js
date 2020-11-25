const mongoose = require("mongoose");

const ForgotPassword=new mongoose.model('ForgotPassword',{
    token:{
        type:String,
        required:true,
    },
    userid:{
        type:mongoose.Types.ObjectId,
        required:true
    }
})

module.exports=ForgotPassword;