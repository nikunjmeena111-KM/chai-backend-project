import {Router} from "express"
import { registerUser } from "../controllers/user.controller.js"
import {upload} from "../middlewhere/multer.js"


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1

        }
    ]),
    registerUser)




export default router 