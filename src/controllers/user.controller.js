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


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
}