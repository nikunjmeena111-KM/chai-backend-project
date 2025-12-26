import dotenv from "dotenv"
import connectDb from "./db/index.js"


dotenv.config({
    path:'./env'
})



connectDb()

.then(()=>{

    app.on("error",(error)=>{
            console.log("error in listning",error)
            throw error
        })

    app.listen(process.env.PORT||7000 ,()=>{
        console.log(`server is running at port:${process.env.PORT}`);
        
    })

})
.catch((error)=>{
    console.log("mongodb connection failed !!!",error);
})












// the code written below is according to aur our first approch which say that we can write our connection code in index.js file only but this make this index file mosre polluted and messy so now we use approch two in our project according to which we make a different file for connection code nad import that file in this index.js file.

/*
import mongoose from "mongoose"
import{DB_Name} from "./constants"
import express from "express"

const app =express();

(async()=>{
    try{

        await mongoose.connect(`process.env.${mongodb_URL}/${DB_Name}`)
        app.on("error",(error)=>{
            console.log("erorr:",error)
            throw error
        })

        app.listen(process.env.PORT,()=> {
            console.log(`the system is listning on port${process.env.PORT}`);
        })

    } catch(error){

        console.log("ERROR:",error)
        throw error s
    }
})()
    
*/    