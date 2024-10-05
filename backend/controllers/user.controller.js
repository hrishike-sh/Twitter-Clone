import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log("Error getting user profile: " + error);
    res.status(500).json({ message: "ERROR" });
  }
};

export const followUnfollowUser = async (req, res) => {
  const { id } = req.params;
  try {
    const userToModify = await User.findById(id).select("-password");
    const currentUser = await User.findById(req.user._id).select("-password");

    if (userToModify._id.toString() === currentUser._id.toString()) {
      return res
        .status(401)
        .json({ error: "You cannot follow/unfollow yourself!" });
    }

    if (!userToModify || !currentUser) {
      return res.status(404).json({ error: "User not found!" });
    }

    if (userToModify.followers.includes(currentUser._id)) {
      // unfollow

      await User.findByIdAndUpdate(id, {
        $pull: {
          followers: currentUser._id,
        },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $pull: {
          following: userToModify._id,
        },
      });
      await res.status(200).json({ message: "Unfollowed successfully" });
    } else {
      // follow
      await User.findByIdAndUpdate(id, {
        $push: {
          followers: currentUser._id,
        },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          following: userToModify._id,
        },
      });

      const newNotification = new Notification({
        from: currentUser._id,
        to: userToModify._id,
        type: "follow",
        read: false,
      });
      await newNotification.save();

      await res.status(200).json({ message: "Followed successfully" });
    }
  } catch (error) {
    console.log("Error following/unfollowing user: " + error);
    res.status(500).json({ message: "ERROR" });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    const usersFollowedByMe = await User.findById(userId).select("following");

    const users = await User.aggregate([
      {
        $match: {
          _id: {
            $ne: userId,
          },
        },
      },
      {
        $sample: {
          size: 10,
        },
      },
    ]);

    const filteredUsers = users.filter((user) => {
      return !usersFollowedByMe.following.includes(user._id);
    });
    const suggestedUsers = filteredUsers.slice(0, 4);
    suggestedUsers.forEach((user) => {
      user.password = undefined;
    });

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error getting suggested users: " + error);
    res.status(500).json({ message: "ERROR" });
  }
};

export const updateUser = async (req, res) => {
  const { fullName, email, username, currentPassword, newPassword, bio, link } =
    req.body;
  let { profileImg, coverImg } = req.body;

  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      (currentPassword && !newPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res
        .status(400)
        .json({ message: "Please provide both old and new password" });
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Incorrect password" });

      if (newPassword.length < 6)
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }

    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }

      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }
    if (coverImg) {
      await cloudinary.uploader.destroy(
        user.coverImg.split("/").pop().split(".")[0]
      );

      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();
    user.password = undefined;
    return res.status(200).json({ user });
  } catch (error) {
    console.log("Error updating user: " + error);
    res.status(500).json({ message: "ERROR" });
  }
};
