const mongoose=require('mongoose')

const groupSchema=new mongoose.Schema({
    author:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:"User"
    },
    title:{
        type:String,
        trim:true,
        required:true,
        unique:true
    },
    displayimg: {
		type: String,
		default: "/assets/images/default-profile-icon.jpg",
		required: true,
	},
    participants:[
        {
            type:mongoose.Types.ObjectId,
            required:true,
            ref:"User"
        }
    ],
})

const Group=mongoose.model('Group',groupSchema);

module.exports=Group;