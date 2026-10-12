import express from "express";

import {
  createPost,
  getPost,
  getPosts,
  getUserPosts,
  deletePost,
  likePost,
  unlikePost
} from "../controllers/postController.js";
import verifyToken from "../middleware/verifyToken.js";
import upload from "../middleware/upload.js";

const postRoutes = express.Router();

postRoutes.post("/", verifyToken, upload.single("media"), createPost);

postRoutes.get("/", verifyToken, upload.single("media"), getPosts);

postRoutes.get(
  "/user/:userId",
  verifyToken,
  upload.single("media"),
  getUserPosts,
);

postRoutes.get("/:postId", verifyToken, getPost);

postRoutes.delete("/:postId", verifyToken, deletePost);

postRoutes.post("/:postId/like", verifyToken, likePost);

postRoutes.delete("/:postId/like", verifyToken, unlikePost);

export default postRoutes;
