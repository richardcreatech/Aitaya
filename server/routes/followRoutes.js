import express from "express";
import {
    getFollowing,
    getFollowingPosts,
    getRecommendedUsers,
    searchUsers,
    followUser
} from "../controllers/followController.js";
import verifyToken from "../middleware/verifyToken.js";

const followRoutes   = express.Router();

followRoutes.get("/following",verifyToken, getFollowing);
followRoutes.get("/recommended",verifyToken,getRecommendedUsers);
followRoutes.get("/search",verifyToken, searchUsers);
followRoutes.get("/posts",verifyToken, getFollowingPosts);
followRoutes.post("/:userId/follow", verifyToken, followUser);

export default followRoutes;