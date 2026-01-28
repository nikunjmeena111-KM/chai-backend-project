import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

// Configuration
//(async function() {

    
    cloudinary.config({ 
        cloud_name: process.env.cloudinary_cloud_name, 
        api_key: process.env.cloudinary_api_key, 
        api_secret: process.env.cloudinary_api_secret,
    });
    
// method to upload the file on cloudinary
const uploadOncloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,
            {
                resource_type:"auto"
            },

        )
        console.log("file succesfully uploaded on cloudinary", (await response).url)

        return response ;
    } 
    catch (error) {
        fs.unlinkSync(localFilePath) // this to remove the locally saved temparory file as the uploud operation failed 
        return null;
    }

}
     


export { uploadOncloudinary }