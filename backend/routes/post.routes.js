import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";

import {
  createPost,
  // likeUnlikePost,
  deletePost,
  commentPost,
  deleteComment,
} from "../controllers/post.controller.js";
const router = express.Router();

router.post("/create", protectRoute, createPost);
// router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", protectRoute, commentPost);
router.delete("/comment/:postId/:id", protectRoute, deleteComment);
router.delete("/:id", protectRoute, deletePost);

export default router;
