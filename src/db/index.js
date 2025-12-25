import mongoose from "mongoose"
import {DB_Name} from "../constants.js"

const connectDb= async ()=>{
    try{
     const connectionInstance =  await mongoose.connect(`${process.env.mongodb_URL}/${DB_Name}`);
     console.log(`\n mongoDB connected !! DB host: ${connectionInstance.connection.host}`)

    } catch(error){

        console.log("MongoDBconnectionError:",error)
        throw error
        // we can also use " process.exit(1)" instead of "throw error" ,you acn lear  why and how we use it using any online resource availabe . 
    }
}


export default connectDb ;