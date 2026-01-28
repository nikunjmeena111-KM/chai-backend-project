import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/APIError.js"
import {User} from "../models/user.model.js"
import { uploadOncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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

const { fullName , username , email , Password}= req.body
console.log("email :",email);

// now using "if" statement we validate ki sab detail is hai ya nahi 
if([ fullName,username,email,Password].some((field)=>field?.trim()==="")){
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
    Password,
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




export {registerUser}