import {Router} from "express"
import { refreshAccessToken,
         loginUser,
         logoutUser, 
         registerUser, 
         changePassword, 
         updateAccountDetails, 
         updateAvatar, 
         updateCoverImage,
         getUserChannleProfile, 
         watchHistory, 
} from "../controllers/user.controller.js"
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

router.route("/getCurrentUser").get(verifyJWT, getCurrentUser)

router.route("/change-password").post(verifyJWT,changePassword)

router.route("/update-Account-Details").patch(verifyJWT,updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"),updateAvatar)

router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannleProfile)

router.route("/watch-History").get(verifyJWT,watchHistory)





export default router 