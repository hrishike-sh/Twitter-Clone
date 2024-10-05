import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!text && !img) {
      return res.status(400).json({ message: "Please provide text or image" });
    }

    if (img) {
      const response = await cloudinary.uploader.upload(img);
      img = response.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      img,
    });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.log("Error creating post: ");
    console.log(error);
    res.status(500).json({ message: "ERROR" });
  }
};


export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (post.img) {
      const id = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(id);
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error deleting post: " + error);
    res.status(500).json({ message: "ERROR" });
  }
};

export const commentPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    let { text, img } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (!text && !img) {
      return res
        .status(403)
        .json({ error: "You must give either text or image!" });
    }

    if (img) {
      const uploaded = await cloudinary.uploader.upload(img);
      img = uploaded.secure_url;
    } else {
      img = "";
    }

    const newComment = {
      user: userId,
      text,
      img,
    };

    await Post.findByIdAndUpdate(id, {
      $push: {
        comments: newComment,
      },
    });

    return res.status(201).json(newComment);
  } catch (error) {
    console.log("Error commenting post: " + error);
    res.status(500).json({ message: "ERROR" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId, id } = req.params;
    console.log(userId, postId, id);
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    console.log(post);
    const postIndex = post.comments.findIndex(
      (comment) =>
        comment._id.toString() === id &&
        comment.user.toString() === userId.toString()
    );
    console.log(postIndex);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Comment not found!" });
    }

    await Post.findByIdAndUpdate(postId, {
      $pull: {
        comments: {
          _id: id,
        },
      },
    });

    return res.status(200).json({ message: "Comment deleted!" });
  } catch (error) {
    console.log("Error deleting comment: " + error);
    res.status(500).json({ message: "ERROR" });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.likes.includes(userId)) {
      await Post.findByIdAndUpdate(id, {
        $pull: {
          likes: userId,
        },
      });
      await User.findByIdAndUpdate(userId, {
        $pull: {
          likedPosts: id,
        },
      });
      return res.status(201).json({ message: "Unliked" });
    } else {
      await Post.findByIdAndUpdate(id, {
        $push: {
          likes: userId,
        },
      });
      await User.findByIdAndUpdate(userId, {
        $push: {
          likedPosts: id,
        },
      });
      return res.status(201).json({ message: "Liked" });
    }
  } catch (error) {
    console.log("Error liking/unliking post: " + error);
    return res.status(500).json({ error: "Error liking/unliking post!" });
  }
};

export const getPosts = async (_, res) => {
  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (posts.length == -1) return res.status(200).json([]);

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error getting posts: " + error);
    res.status(500).json({ message: "ERROR" });
  }
};

export const getLikes = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await User.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found!" });
    }
    const likedPosts = await Post.find({
      _id: { $in: post.likedPosts },
    })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "likes",
        select: "-password",
      });
    res.status(200).json(likedPosts);
  } catch (error) {
    console.log("Error getting getLikes: " + error);
    res.status(500).json({ error: "Error getting getLikes!" + error });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found!" });

    const following = user.following;
    const feedPosts = await Post.find({
      user: { $in: following },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    return res.status(200).json(feedPosts);
  } catch (error) {
    console.log("Error getting getFollowingPosts: " + error);
    res.status(500).json({ error: "Error getting getFollowingPosts!" + error });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found!" });

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      });

    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error getting getUserPosts: " + error);
    res.status(500).json({ error: "Error getting getUserPosts!" + error });
  }
};
