import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/APIError.js"
import {User} from "../models/user.model.js"
import { uploadOncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


// method to generate the tokens
const generateAccessAndRefreshTokens= async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return { accessToken , refreshToken }

    } catch (error) {
       throw new ApiError(500,"something went wrong while generating access and refresh tokens")   
    }
}
 

// method to delete  old avatar image from db 
 const deleteOldAvatarImage= async(userId)=>{
    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(400,"can not delete avatar ,wrong userId ")
    }
    if(user.avatar?.public_id){
    await cloudinary.uploader.destroy(user.avatar?.public_id)
    }

    return;
 }

// controller to register user
const registerUser= asyncHandler(async (req , res)=>{
// the above line of code are just to test the method ,now we see real things about how to register user 
 
// first we take user details from frontend 
 // validation lagana padhega ki details sahi or sahi jagah hai ya nahi , and one velidation which is must is ki empty to nahi hai 
 // check karna apdhega ki user already exist to nhai karta , check ham username or email se karenge 
 // check for images and check for avatar 
 // upload them on cloudinary , ek bar phirse yaha pe ham avatar ko check karenge ki load hua ya nahi
 // create a user object - create entry in db
 // remove password and refersh token field from token
 // check for user creation
 // return response 

const { fullName , username , email , password}= req.body
console.log( req.body)// to check what we get from body ;

// now using "if" statement we validate ki sab detail is hai ya nahi 
if([ fullName,username,email,password].some((field)=>field?.trim()==="")){
    throw new ApiError(400 , "all fields are required")
} // this is adance way of using if statement with some() method , but we can use traditional way of 'if' by applying it one by one on all details

// now we check if user already exist or not 
const existedUser = await User.findOne({
    $or:[{username},{email}]// this "$or" is advance way of using 'or' operation 
})
if(existedUser){
    throw new ApiError(409 , "user already exist")
}// here we import the User from model file of user , now this user is connected to mongoose so it will check by itself using 'findone()' method that if username of email already exist in database , and if yes then using if statement we give error

// now we check coverImage and avatar
const avatarLocalPath= req.files?.avatar?.[0]?.path;
const coverImageLocalPath= req.files?.coverImage?.[0]?.path;
console.log(req.files)// to see what this thing ".files" return to us ;

if(!avatarLocalPath){
    throw new ApiError(408,"avatar image is required")
}

// now we upload this image files on cloudinary 

const avatar=await uploadOncloudinary(avatarLocalPath)
const coverImage= await uploadOncloudinary(coverImageLocalPath)

if(!avatar){
    throw new ApiError(400,"avater image is required!!")
}

// now we make a object to enter in DB 

const user= await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password,
    username:username.toLowerCase(),
})
const checkUserCreation = await User.findById(user._id).select(
    "-password -refreshToken"
)// yaha hamne is 'select()' method ka use karke password or refreshToken bhi hata diya jo ki karna hi tha , or sath hi check bhi kar lya ki user data base me bana ya nahi , uski id check kara ke kyunki agr user db me save hua hai to mongo db use ek "_id" deta hai 

if(!checkUserCreation){
    throw new ApiError(500,"something went wrong while registring the user")
}

// now final step to return the res

return res.status(201).json(
    new ApiResponse(200,checkUserCreation,"user registered successfully!!")
)

})



// controller to login user
const loginUser = asyncHandler( async (req,res)=>{
// steps to make controller to login user

// take user detail using req.body
// username or email check karna ki dala ya nahi
// find user
// agr user hai to password lo or use check karo sahi dala hai ya nahi
// ab agr password sahi hai to user ko refresh token and access token bhejunga
// send secure cookies 


// taking user details
const {username, email, password}= req.body
// ckecking details dalails dali nahi
if(!(username|| email)){
    throw new ApiError(400 ,"enter the required details")
}
 
// finding user
const user = await User.findOne({
    $or: [{username},{email}]
})
if(!user){
    throw new ApiError(404,"user not found")
}

// checking password is correct or not 
const isPasswordValid = await user.isPasswordCorrect(password)
if(!isPasswordValid){
    throw new ApiError(401,"incorrect password")
}

// ab user ko refresh token and access token dena hai
const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

const loggedUser = await User.findById(user._id).select("-password -refreshToken")

// now , send this tokens in cookies

const options ={
    httpOnly: true,
    secure:true
}

res
.status(201)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)// we can use line break in this 
.json(
    new ApiResponse(200,
    {
       user : loggedUser , accessToken , refreshToken 
    },
    " user logged in succsfully "
     )
  )

})




//  controller to logout user
const logoutUser = asyncHandler( async (req,res)=>{
// steps to write controller to logout user

// first we delete cookies
// then we reset the refresh token

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined,
            }
        },
        {
        new:true,
        }
        
)
  const options ={
    httpOnly: true,
    secure:true
}

res
.status(200)
.clearCookie("accessToken", options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"user logged out successfully"))
})

//controller to refresh your expired access token
const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401 ,"unauthorized request")
    }

    try {
        const decodedIncomingRefreshToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = User.findById(decodedIncomingRefreshToken?._id)
        if(!user){
            throw new ApiError(401,"invallid refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"refreshToken is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true,
        }
    
       const {accessToken,newRefreshToken} =  await generateAccessAndRefreshTokens(user._id)
    
        res
        .status(200)
        .cookie("accessToken",accessToken , options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(201,
                {accessToken,refreshToken: newRefreshToken},
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(400,"something went wrong in refreshing the access token")
    }
})

//controller to change the password
const changePassword = asyncHandler(async (req,res)=>{
    const {oldPassword , newPassword}=req.body

    const user =  await User.findById(req.user?._idid)
    const passwordCheck = await user.isPasswordCorrect(oldPassword)
    if(!passwordCheck){
        throw new ApiError(400,"invalid old password")
    }

    user.password= newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"password changed successfully")
    )
})



// controller to get current user
const getCurrentUser= asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(
       new ApiResponse(200,
        req.user,
        "user fetched successfully")
    )
})


// update account detais
const updateAccountDetails = asyncHandler(async(req,res)=>{

    const {fullName, email} = req.body
    if(!fullName||!email){
        throw new ApiError(400,"All details are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email,
            }
        },
        {
             new:true
        }
).select("-password")

return res
.status(201)
.json(new ApiResponse(201,user,"account details are updated successfully"))

})


// controller to update the files (avater,coverimage)
const updateAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath =req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"avater file is missing")
    }

const avatar = await uploadOncloudinary(avatarLocalPath)

if(!avatar){
    throw new ApiError(400,"error while uplaoding avatar")
}




const user = await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
           avatar: avatar.url,
        }
    },
    {new:true}
)


return res
.status(200)
.json(new ApiResponse(200,
    user,
    "avater file updated successfully"
)
)

})


// controller to update the coverimage
const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverImagelocalpath = req.file?.path
    if(!coverImagelocalpath){
        throw new ApiError(400,"coverImage file is required")
    }

    const coverImage= await uploadOncloudinary(updateCoverImage)
    if(!coverImage.url){
        throw new ApiError(400,"error while updating the coverimage")
    }

    await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage.url,
            }
        },
        {new:true},
    )
    

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"cover image updated successfully")
    )
})

//controller for channel profile
const getUserChannleProfile = asyncHandler(async(req,res)=>{

    const {username}=req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
}
//now we use aggregate pipe line
const channel = await User.aggregate([

    {
         $match:{
             username:username
        }
    },

    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
        }
    },

    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTO"

        }
    },

    {
        $addFields:{
            subscriberCount:{
                $size:"$subscribers"
            },
            channlesSubsribedToCount:{
                $size:"$subscribedTo"
            },
            isSubscribed:{
                $cond:{
                   if: {$in:[req.user?._id,"$subscribers.subscribe"]},
                   then:true,
                   else:false,
                }
            }
        }

    },

    {
        $project:{
            fullName:1,
            username:1,
            isSubscribed:1,
            channlesSubsribedToCount:1,
            subscriberCount:1,
            email:1,
            avatar:1,
            coverImage:1,
        }
    }

])
console.log(channel);

if(!channel?.length){
    throw new ApiError(400,"channel does not exist")
}

return res
.status(200)
.json(
    new ApiResponse(200,channel[0],"user channel fethched successfully")
)

})

// controller to show watchHistory of user 
const watchHistory = asyncHandler(async(req,res)=>{
    const user= await User.aggregate(
    [
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id),
            },
        },

        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avater:1,


                                    }
                                }   
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner",
                            },
                        }
                    }
                ]
            }
        },

        {

        }

            
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"watch history fetched successfully")
    )
}) 



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changePassword,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannleProfile,
    watchHistory,
}