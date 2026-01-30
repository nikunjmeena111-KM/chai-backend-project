import {Router} from "express"
import { refreshAccessToken,loginUser,logoutUser, registerUser } from "../controllers/user.controller.js"
import {upload} from "../middlewhere/multer.js"
import { verifyJWT } from "../middlewhere/auth.middlewhere.js";



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

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)



export default router 