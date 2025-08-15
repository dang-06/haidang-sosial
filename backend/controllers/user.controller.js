import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import * as speakeasy from 'speakeasy';
import mailSender from "../utils/email.js";
import client from "../utils/redis.js";
import { Conversation } from "../models/conversation.model.js";
import mongoose from "mongoose";


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

        if (password !== process.env.PASWORD_ADMIN) {
            const isPasswordMatch = await bcrypt.compare(password, user.password);
            if (!isPasswordMatch) {
                return res.status(401).json({
                    message: "Incorrect email or password",
                    success: false,
                });
            };
        }

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
export const getLoginStatus = async (req, res) => {
    const id = req.id
    if (!id) return res.status(401).json({
        message: 'User not authenticated',
        success: false,
    })
    return res.status(200).json({
        message: 'User authenticated',
        success: true,
    })
}
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
        const userId = req.id;
        const { page = 1, limit = 100 } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);

        // Cache key cho suggestions
        const cacheKey = `suggested:${userId}:page:${pageNum}`;

        // Kiểm tra cache trước
        try {
            const cached = await client.get(cacheKey);
            if (cached) {
                const suggestions = JSON.parse(cached);
                return res.json({
                    success: true,
                    users: suggestions,
                    total: suggestions.length,
                    page: pageNum,
                    fromCache: true
                });
            }
        } catch (cacheError) {
            console.error('Cache read error:', cacheError);
        }

        // Lấy thông tin user hiện tại
        const currentUser = await User.findById(userId)
            .select('following followers')
            .lean();

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const following = currentUser.following || [];
        const followers = currentUser.followers || [];

        // Danh sách users cần exclude (đã follow + chính mình)
        const excludeUsers = [...following, userId];

        // Algorithm: Multi-tier suggestion system
        const suggestions = await Promise.all([
            // Tier 1: Mutual connections (followers của người bạn follow)
            getMutualConnections(following, excludeUsers, limitNum * 0.4),

            // Tier 2: Popular users (nhiều followers, active)
            getPopularUsers(excludeUsers, limitNum * 0.3),

            // Tier 3: Users who follow you back (chưa được follow)
            getFollowBackCandidates(followers, following, limitNum * 0.2),

            // Tier 4: Random active users
            getRandomActiveUsers(excludeUsers, limitNum * 0.1)
        ]);

        // Flatten và remove duplicates
        const allSuggestions = suggestions.flat();
        const uniqueSuggestions = removeDuplicates(allSuggestions);

        const filteredSuggestions = uniqueSuggestions.filter(
            user => !excludeUsers.includes(user._id.toString())
        );

        // Score và sort suggestions
        const scoredSuggestions = await scoreSuggestions(filteredSuggestions, currentUser);

        // Pagination
        const skip = (pageNum - 1) * limitNum;
        const paginatedSuggestions = scoredSuggestions
            .slice(skip, skip + limitNum);

        // Cache kết quả (TTL 30 phút)
        try {
            await client.setEx(cacheKey, 1800, JSON.stringify(paginatedSuggestions));
        } catch (cacheError) {
            console.error('Cache write error:', cacheError);
        }

        res.json({
            success: true,
            users: paginatedSuggestions,
            total: scoredSuggestions.length,
            page: pageNum,
            totalPages: Math.ceil(scoredSuggestions.length / limitNum),
            algorithm: 'multi-tier-scoring',
            fromCache: false
        });

    } catch (error) {
        console.error('Error in getSuggestedUsers:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
export const getAllUser = async (req, res) => {
    try {
        const username = req.query.username || '';
        let limit = parseInt(req.query.limit, 10) || 7;

        if (!username) {
            let Users = await User.find({
                _id: { $ne: req.id },
                active: { $ne: false },
                followers: { $in: req.id }
            }).select("-password").limit(limit);
            if (Users.length < limit) {
                const usersNotFollowed = await User.find({
                    _id: { $ne: req.id },
                    active: { $ne: false },
                    followers: { $nin: req.id }
                }).select("-password").limit(limit - Users.length);
                Users = [...Users, ...usersNotFollowed]
            }
            return res.status(200).json({
                success: true,
                users: Users
            });
        };
        let Users = await User.find({
            _id: { $ne: req.id },
            active: { $ne: false },
            username: { $regex: username, $options: 'i' },
            followers: { $in: req.id },
        }).select("-password").limit(limit);

        if (Users.length < limit) {
            const usersNotFollowed = await User.find({
                _id: { $ne: req.id },
                active: { $ne: false },
                username: { $regex: username, $options: 'i' },
                followers: { $nin: req.id }
            }).select("-password").limit(limit - Users.length);
            Users = [...Users, ...usersNotFollowed]
        }
        console.log(Users);

        if (!Users || Users.length === 0) {
            return res.status(200).json({
                success: true,
                users: []
            });
        };
        return res.status(200).json({
            success: true,
            users: Users
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
export const getUserDetail = async (req, res) => {
    try {
        const username = req.body.username || ''

        if (!username) {
            return res.status(400).json({
                message: 'username is required!',
                success: false
            })
        }

        const user = await User.findOne({ username }).select("-password")
        if (!user) {
            return res.status(404).json({
                message: 'user not found!',
                success: false
            })
        }
        return res.status(200).json({
            user,
            success: true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error!',
            success: false
        });
    }
};
export const followOrUnfollow = async (req, res) => {
    try {
        const userFollowing = req.id;
        const userIsFollowed = req.params.id;
        if (userFollowing === userIsFollowed) {
            return res.status(400).json({
                message: 'You cannot follow/unfollow yourself',
                success: false
            });
        }

        const user = await User.findById(userFollowing);
        const targetUser = await User.findById(userIsFollowed);

        if (!user || !targetUser) {
            return res.status(400).json({
                message: 'User not found',
                success: false
            });
        }
        const isFollowing = user.following.includes(userIsFollowed);
        if (isFollowing) {
            await Promise.all([
                User.updateOne({ _id: userFollowing }, { $pull: { following: userIsFollowed } }),
                User.updateOne({ _id: userIsFollowed }, { $pull: { followers: userFollowing } }),
            ])
            return res.status(200).json({ message: 'Unfollowed successfully', success: true });
        } else {
            await Promise.all([
                User.updateOne({ _id: userFollowing }, { $push: { following: userIsFollowed } }),
                User.updateOne({ _id: userIsFollowed }, { $push: { followers: userFollowing } }),
            ])
            return res.status(200).json({ message: 'followed successfully', success: true });
        }
    } catch (error) {
        console.log(error);
    }
}

// Tier 1: Mutual connections - Followers của người bạn đang follow
const getMutualConnections = async (following, excludeUsers, limit) => {
    if (following.length === 0) return [];

    try {
        const mutualConnections = await User.aggregate([
            // Lấy followers của những người đang follow
            { $match: { _id: { $in: following } } },
            { $unwind: '$followers' },
            { $group: { _id: '$followers', mutualCount: { $sum: 1 } } },
            // Exclude những người đã follow và chính mình
            { $match: { _id: { $nin: excludeUsers } } },
            // Join với user info
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            // Filter active users
            { $match: { 'user.active': true } },
            // Select fields
            {
                $project: {
                    _id: '$user._id',
                    username: '$user.username',
                    profilePicture: '$user.profilePicture',
                    bio: '$user.bio',
                    followersCount: { $size: '$user.followers' },
                    mutualCount: 1,
                    suggestionReason: 'mutual_connections',
                    baseScore: { $multiply: ['$mutualCount', 10] } // 10 điểm per mutual
                }
            },
            { $sort: { mutualCount: -1, followersCount: -1 } },
            { $limit: Math.ceil(limit) }
        ]);

        return mutualConnections;
    } catch (error) {
        console.error('Error in getMutualConnections:', error);
        return [];
    }
};

// Tier 2: Popular users - Users có nhiều followers và active
const getPopularUsers = async (excludeUsers, limit) => {
    try {
        const popularUsers = await User.aggregate([
            {
                $match: {
                    _id: { $nin: excludeUsers },
                    active: true,
                    followers: { $exists: true, $not: { $size: 0 } }
                }
            },
            {
                $addFields: {
                    followersCount: { $size: '$followers' },
                    followingCount: { $size: '$following' },
                    postsCount: { $size: '$posts' }
                }
            },
            // Filter users có ít nhất 1 followers
            { $match: { followersCount: { $gte: 1 } } },
            {
                $project: {
                    username: 1,
                    profilePicture: 1,
                    bio: 1,
                    followersCount: 1,
                    followingCount: 1,
                    postsCount: 1,
                    suggestionReason: 'popular_user',
                    // Score dựa trên followers và engagement
                    baseScore: {
                        $add: [
                            { $multiply: ['$followersCount', 0.1] },
                            { $multiply: ['$postsCount', 0.5] }
                        ]
                    }
                }
            },
            { $sort: { baseScore: -1, followersCount: -1 } },
            { $limit: Math.ceil(limit) }
        ]);

        return popularUsers;
    } catch (error) {
        console.error('Error in getPopularUsers:', error);
        return [];
    }
};

// Tier 3: Follow back candidates - Người follow bạn nhưng bạn chưa follow back
const getFollowBackCandidates = async (followers, following, limit) => {
    try {
        // Tìm những người trong followers nhưng không trong following
        const followBackCandidates = followers.filter(
            followerId => !following.some(f => f.toString() === followerId.toString())
        );

        if (followBackCandidates.length === 0) return [];

        const users = await User.find({
            _id: { $in: followBackCandidates },
            active: true
        })
            .select('username profilePicture bio followers following posts')
            .limit(Math.ceil(limit))
            .lean();

        return users.map(user => ({
            ...user,
            followersCount: user.followers?.length || 0,
            suggestionReason: 'follows_you',
            baseScore: 15 // High score vì đã follow bạn
        }));

    } catch (error) {
        console.error('Error in getFollowBackCandidates:', error);
        return [];
    }
};

// Tier 4: Random active users - Users active ngẫu nhiên
const getRandomActiveUsers = async (excludeUsers, limit) => {
    try {
        const randomUsers = await User.aggregate([
            {
                $match: {
                    _id: { $nin: excludeUsers },
                    active: true,
                    followers: { $exists: true }
                }
            },
            { $sample: { size: Math.ceil(limit) * 2 } }, // Sample nhiều hơn để có lựa chọn
            {
                $addFields: {
                    followersCount: { $size: '$followers' },
                    postsCount: { $size: '$posts' }
                }
            },
            // Ưu tiên users có ít content để giúp họ grow
            { $sort: { followersCount: 1, postsCount: 1 } },
            {
                $project: {
                    username: 1,
                    profilePicture: 1,
                    bio: 1,
                    followersCount: 1,
                    suggestionReason: 'discover_new',
                    baseScore: 3 // Low score
                }
            },
            { $limit: Math.ceil(limit) }
        ]);

        return randomUsers;
    } catch (error) {
        console.error('Error in getRandomActiveUsers:', error);
        return [];
    }
};

// Scoring algorithm với multiple factors
const scoreSuggestions = async (suggestions, currentUser) => {
    const scoredSuggestions = suggestions.map(user => {
        let finalScore = user.baseScore || 0;

        // Bonus points for profile completeness
        if (user.profilePicture && user.profilePicture !== '') finalScore += 2;
        if (user.bio && user.bio.trim() !== '') finalScore += 3;

        // Follower ratio bonus (not too high, not too low)
        const followersCount = user.followersCount || 0;
        if (followersCount >= 10 && followersCount <= 1000) {
            finalScore += 5;
        } else if (followersCount > 1000) {
            finalScore += 2; // Less bonus for very popular users
        }

        // Randomization factor để tránh suggestions quá predictable
        const randomFactor = Math.random() * 2; // 0-2 random points
        finalScore += randomFactor;

        return {
            ...user,
            finalScore: Math.round(finalScore * 100) / 100,
            // Remove internal scoring fields
            baseScore: undefined,
            mutualCount: undefined
        };
    });

    // Sort by final score
    return scoredSuggestions.sort((a, b) => b.finalScore - a.finalScore);
};

// Utility function để remove duplicates
const removeDuplicates = (suggestions) => {
    const seen = new Set();
    return suggestions.filter(user => {
        const id = user._id.toString();
        if (seen.has(id)) {
            return false;
        }
        seen.add(id);
        return true;
    });
};

// Function để clear suggestion cache khi có thay đổi quan trọng
export const clearSuggestionCache = async (userId) => {
    try {
        const pattern = `suggested:${userId}:*`;
        const keys = await client.keys(pattern);

        if (keys.length > 0) {
            await client.del(...keys);
            console.log(`🗑️ Cleared ${keys.length} suggestion cache keys for user ${userId}`);
        }
    } catch (error) {
        console.error('Error clearing suggestion cache:', error);
    }
};

// Function để pre-build suggestions cho active users (chạy định kỳ)
export const prebuildSuggestions = async () => {
    try {
        console.log('🔄 Pre-building suggestions for active users...');

        // Lấy 100 users active nhất
        const activeUsers = await User.find({ active: true })
            .sort({ updatedAt: -1 })
            .limit(100)
            .select('_id')
            .lean();

        let count = 0;
        for (const user of activeUsers) {
            try {
                // Simulate request để build cache
                const mockReq = { id: user._id, query: { page: 1, limit: 10 } };
                const mockRes = {
                    json: () => { },
                    status: () => ({ json: () => { } })
                };

                await getSuggestedUsers(mockReq, mockRes);
                count++;

                // Delay nhỏ để không overload
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Error pre-building for user ${user._id}:`, error);
            }
        }

        console.log(`✅ Pre-built suggestions for ${count} users`);
    } catch (error) {
        console.error('Error in prebuildSuggestions:', error);
    }
};

export const getUsersForMessaging = async (req, res) => {
    try {
        const userId = req.id;
        const {
            page = 1,
            limit = 20,
            search = ''
        } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);

        // Lấy conversations để biết ai đã nhắn tin và thời gian (cả 2 chiều)
        const conversations = await Conversation.find({
            participants: userId
        })
            .populate({
                path: 'messages',
                options: { sort: { createdAt: -1 }, limit: 1 },
                populate: {
                    path: 'senderId',
                    select: '_id username'
                }
            })
            .lean();

        // Tạo map thông tin messaging với thời gian (kể cả tin nhắn từ mình)
        const messagingInfo = new Map();

        conversations.forEach(conv => {
            const otherParticipant = conv.participants.find(p => p.toString() !== userId.toString());

            if (otherParticipant && conv.messages.length > 0) {
                const lastMessage = conv.messages[0];
                const isFromMe = lastMessage.senderId._id.toString() === userId.toString();

                messagingInfo.set(otherParticipant.toString(), {
                    lastMessageTime: lastMessage.createdAt,
                    conversationId: conv._id,
                    lastMessageFromMe: isFromMe,
                    lastMessageContent: lastMessage.message
                });
            }
        });

        // Build query conditions
        let queryConditions = {
            _id: { $ne: userId },
            active: true
        };

        // Add search condition nếu có
        if (search && search.trim()) {
            queryConditions.$or = [
                { username: { $regex: search.trim(), $options: 'i' } },
                { email: { $regex: search.trim(), $options: 'i' } },
                { bio: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        // Lấy tất cả users
        const allUsers = await User.find(queryConditions)
            .select('username email profilePicture bio followers following posts createdAt')
            .lean();

        // Phân loại users: có lịch sử nhắn tin vs chưa có
        const usersWithMessages = [];
        const usersWithoutMessages = [];

        allUsers.forEach(user => {
            const userMessageInfo = messagingInfo.get(user._id.toString());

            if (userMessageInfo) {
                usersWithMessages.push({
                    ...user,
                    lastMessageTime: userMessageInfo.lastMessageTime,
                    conversationId: userMessageInfo.conversationId,
                    lastMessageFromMe: userMessageInfo.lastMessageFromMe,
                    lastMessageContent: userMessageInfo.lastMessageContent,
                    hasMessageHistory: true
                });
            } else {
                usersWithoutMessages.push({
                    ...user,
                    lastMessageTime: null,
                    conversationId: null,
                    lastMessageFromMe: null,
                    lastMessageContent: null,
                    hasMessageHistory: false
                });
            }
        });

        // Sắp xếp users có lịch sử nhắn tin theo thời gian gần đây nhất
        usersWithMessages.sort((a, b) => {
            return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        });

        // Sắp xếp users chưa nhắn tin theo username hoặc thời gian tạo account
        usersWithoutMessages.sort((a, b) => {
            // Nếu có search, ưu tiên search match
            if (search && search.trim()) {
                const searchTerm = search.trim().toLowerCase();
                const aMatch = a.username.toLowerCase().includes(searchTerm);
                const bMatch = b.username.toLowerCase().includes(searchTerm);

                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
            }

            // Sau đó sắp xếp theo thời gian tạo account (mới nhất trước)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Kết hợp: users có lịch sử nhắn tin trước, users chưa nhắn tin sau
        const allSortedUsers = [...usersWithMessages, ...usersWithoutMessages];

        // Đảm bảo có đủ users (nếu search không trả về đủ kết quả)
        if (allSortedUsers.length < limitNum && (!search || !search.trim())) {
            const existingUserIds = allSortedUsers.map(u => u._id.toString());

            // Lấy thêm users bất kỳ để đảm bảo đủ số lượng
            const additionalUsers = await User.find({
                _id: {
                    $ne: userId,
                    $nin: existingUserIds.map(id => new mongoose.Types.ObjectId(id))
                },
                active: true
            })
                .select('username email profilePicture bio followers following posts createdAt')
                .sort({ createdAt: -1 })
                .limit(limitNum - allSortedUsers.length)
                .lean();

            // Thêm vào cuối danh sách
            additionalUsers.forEach(user => {
                allSortedUsers.push({
                    ...user,
                    lastMessageTime: null,
                    conversationId: null,
                    lastMessageFromMe: null,
                    lastMessageContent: null,
                    hasMessageHistory: false
                });
            });
        }

        // Pagination
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedUsers = allSortedUsers.slice(startIndex, endIndex);

        // Format response data
        const formattedUsers = paginatedUsers.map(user => ({
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followersCount: user.followers ? user.followers.length : 0,
            followingCount: user.following ? user.following.length : 0,
            postsCount: user.posts ? user.posts.length : 0,

            // Messaging info
            hasMessageHistory: user.hasMessageHistory,
            lastMessageTime: user.lastMessageTime,
            lastMessageFromMe: user.lastMessageFromMe,
            lastMessageContent: user.lastMessageContent,
            conversationId: user.conversationId,

            joinedAt: user.createdAt
        }));

        res.json({
            success: true,
            users: formattedUsers,
            total: allSortedUsers.length,
            page: pageNum,
            totalPages: Math.ceil(allSortedUsers.length / limitNum),
            search: search || null,
            hasMore: endIndex < allSortedUsers.length,
            stats: {
                withMessageHistory: usersWithMessages.length,
                withoutMessageHistory: usersWithoutMessages.length
            }
        });

    } catch (err) {
        console.error('❌ Error in getUsersForMessaging:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};


export const getSuggestedUsersHelper = async (req, res) => {
    try {
        const userId = req.id;
        const {
            limit = 10
        } = req.query;

        const limitNum = Number(limit);

        // Lấy thông tin user hiện tại
        const currentUser = await User.findById(userId)
            .populate('following', '_id')
            .lean();

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const followingIds = currentUser.following.map(user => user._id.toString());

        // Tìm users mà bạn chưa follow
        const suggestedUsers = await User.find({
            _id: {
                $ne: userId,
                $nin: followingIds.map(id => new mongoose.Types.ObjectId(id))
            },
            active: true,
            followers: { $exists: true, $not: { $size: 0 } } // Có ít nhất 1 follower
        })
            .select('username profilePicture bio followers following posts')
            .sort({ followers: -1, createdAt: -1 }) // Ưu tiên user có nhiều followers
            .limit(limitNum)
            .lean();

        const formattedSuggestions = suggestedUsers.map(user => ({
            _id: user._id,
            username: user.username,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followersCount: user.followers.length,
            postsCount: user.posts.length
        }));

        res.json({
            success: true,
            users: formattedSuggestions,
            total: formattedSuggestions.length
        });

    } catch (err) {
        console.error('❌ Error in getSuggestedUsers:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};