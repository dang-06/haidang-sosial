import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import * as speakeasy from 'speakeasy';
import mailSender from "../utils/email.js";


export const verifyEmail = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check!",
                success: false,
            });
        }
        const user = await User.findOne({ email });
        if (user?.active) {
            return res.status(401).json({
                message: "Try different email",
                success: false,
            });
        };
        const userByUserName = await User.findOne({ username });
        if (userByUserName?.active) {
            return res.status(401).json({
                message: "Try different user name",
                success: false,
            });
        };

        const secret = speakeasy.generateSecret();

        const totp = speakeasy.totp({
            secret: secret.base32,
            encoding: 'base32',
            digits: process.env.OTP_LENGTH || 6,
            step: process.env.OTP_EXPIRATION_TIME || 600,
        });

        const hashedPassword = await bcrypt.hash(password, 10);
        if ((user && !user?.active) || (userByUserName && !userByUserName?.active)) {
            if (user && !user?.active) {
                console.log(username);
                user.username = username
                user.email = email
                user.password = hashedPassword
                user.active = false
                user.totp = secret.base32
                await user.save()
            } else if (userByUserName && !userByUserName.active) {
                userByUserName.username = username;
                userByUserName.email = email;
                userByUserName.password = hashedPassword;
                userByUserName.active = false;
                userByUserName.totp = secret.base32;
                await userByUserName.save();
            }
        } else {
            await User.create({
                username,
                email,
                password: hashedPassword,
                active: false,
                totp: secret.base32
            });
        }


        try {
            await mailSender(
                email,
                'Verify Account',
                `<p>Mã OTP của bạn là <b><span style="font-size: larger; color: red;">${totp}</span></b> 
              <br>Lưu ý mã này chỉ tồn tại trong ${process.env.OTP_EXPIRATION_TIME} giây. Vui lòng không chia sẻ mã này với bất kỳ ai!</p>`,
            );
        } catch {
            return res.status(401).json({
                message: "Email not send!",
                success: false,
            });
        }
        return res.status(201).json({
            message: "Email send successfully.",
            success: true,
        });
    } catch (error) {
        console.log(error);
    }
}
export const register = async (req, res) => {
    try {
        const { username, email, password, totp } = req.body;
        if (!username || !email || !password || !totp) {
            return res.status(401).json({
                message: "Something is missing, please check!",
                success: false,
            });
        }
        const user = await User.findOne({ email });
        if (user && user.active) {
            return res.status(401).json({
                message: "Try different email",
                success: false,
            });
        };
        const verified = speakeasy.totp.verify({
            secret: user.totp,
            encoding: 'base32',
            token: totp,
            digits: process.env.OTP_LENGTH,
            step: process.env.OTP_EXPIRATION_TIME,
        });
        if (!verified) {
            return res.status(401).json({
                message: "OTP Incorrect",
                success: false,
            });
        }
        user.active = true
        await user.save()
        try {
            await mailSender(
                email,
                'Account created',
                `Tài khoản của bạn đã được<b><span style="font-size: larger; color: blue;"> tạo thành công!</span></b>`,
            );
        } catch {
            return res.status(401).json({
                message: "Email not send!",
                success: false,
            });
        }
        return res.status(201).json({
            message: "Account created successfully.",
            success: true,
        });
    } catch (error) {
        console.log(error);
    }
}
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check!",
                success: false,
            });
        }
        let user = await User.findOne({ email });
        if (!user || !user.active) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false,
            });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false,
            });
        };

        const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });

        // populate each post if in the posts array
        const populatedPosts = await Promise.all(
            user.posts.map(async (postId) => {
                const post = await Post.findById(postId);
                if (post.author.equals(user._id)) {
                    return post;
                }
                return null;
            })
        )
        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: populatedPosts
        }
        return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 1 * 24 * 60 * 60 * 1000 }).json({
            message: `Welcome back ${user.username}`,
            success: true,
            user
        });

    } catch (error) {
        console.log(error);
    }
};
export const logout = async (_, res) => {
    try {
        return res.cookie("token", "", { maxAge: 0 }).json({
            message: 'Logged out successfully.',
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};
export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        let user = await User.findById(userId).populate({ path: 'posts', createdAt: -1 }).populate('bookmarks');
        return res.status(200).json({
            user,
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};

export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        let cloudResponse;

        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: 'User not found.',
                success: false
            });
        };
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message: 'Profile updated.',
            success: true,
            user
        });

    } catch (error) {
        console.log(error);
    }
};
export const getSuggestedUsers = async (req, res) => {
    try {
        const suggestedUsers = await User.find({ _id: { $ne: req.id }, active: { $ne: false} }).select("-password");
        if (!suggestedUsers) {
            return res.status(400).json({
                message: 'Currently do not have any users',
            })
        };
        return res.status(200).json({
            success: true,
            users: suggestedUsers
        })
    } catch (error) {
        console.log(error);
    }
};
export const followOrUnfollow = async (req, res) => {
    try {
        const followKrneWala = req.id;
        const jiskoFollowKrunga = req.params.id;
        if (followKrneWala === jiskoFollowKrunga) {
            return res.status(400).json({
                message: 'You cannot follow/unfollow yourself',
                success: false
            });
        }

        const user = await User.findById(followKrneWala);
        const targetUser = await User.findById(jiskoFollowKrunga);

        if (!user || !targetUser) {
            return res.status(400).json({
                message: 'User not found',
                success: false
            });
        }
        const isFollowing = user.following.includes(jiskoFollowKrunga);
        if (isFollowing) {
            await Promise.all([
                User.updateOne({ _id: followKrneWala }, { $pull: { following: jiskoFollowKrunga } }),
                User.updateOne({ _id: jiskoFollowKrunga }, { $pull: { followers: followKrneWala } }),
            ])
            return res.status(200).json({ message: 'Unfollowed successfully', success: true });
        } else {
            await Promise.all([
                User.updateOne({ _id: followKrneWala }, { $push: { following: jiskoFollowKrunga } }),
                User.updateOne({ _id: jiskoFollowKrunga }, { $push: { followers: followKrneWala } }),
            ])
            return res.status(200).json({ message: 'followed successfully', success: true });
        }
    } catch (error) {
        console.log(error);
    }
}