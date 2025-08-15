import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { Notification } from "../models/notification.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import e from "cors";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;
import { SocketService } from "../services/socket.service.js";
import { notificationType } from "../utils/constant.js";
import moment from "moment";
import { postQueue } from "../utils/queueConfig.js";
import client from "../utils/redis.js";

// export const addNewPost = async (req, res) => {
//     try {
//         const { caption } = req.body;
//         const images = req.files;
//         const authorId = req.id;
//         const imageUploadPromises = images.map(async (image) => {
//             const optimizedImageBuffer = await sharp(image.buffer)
//                 .resize({ width: 1000, height: 1000, fit: 'inside' })
//                 .toFormat('jpeg', { quality: 100 })
//                 .toBuffer();
//             const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
//             const cloudResponse = await cloudinary.uploader.upload(fileUri);
//             return cloudResponse.secure_url;
//         });
//         const imageUrls = await Promise.all(imageUploadPromises);
//         const post = await Post.create({
//             caption,
//             image: imageUrls,
//             author: authorId
//         });
//         const user = await User.findById(authorId);
//         if (user) {
//             user.posts.push(post._id);
//             await user.save();
//         }
//         await post.populate({ path: 'author', select: '-password' });
//         return res.status(201).json({
//             message: 'New post added',
//             post,
//             success: true,
//         });
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ message: 'An error occurred', error: error.message });
//     }
// };

export const addNewPost = async (req, res) => {
    // req.id = '6895a9d2583e45c670756a42';
    try {
        const { caption } = req.body;
        const images = req.files;
        const authorId = req.id;

        // Đẩy job vào queue
        await postQueue.add('newPost', {
            caption,
            images: images?.map(img => img.buffer.toString('base64')), // truyền dạng base64
            authorId
        });

        return res.status(202).json({
            message: 'Post is being processed',
            success: true,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred', error: error.message });
    }
};

export const getAllPost = async (req, res) => {
    // req.id = '6895a9d2583e45c670756a42';
    try {
        const userId = req.id;
        const {
            page = 1,
            limit = 10,
            type = 'following', // 'hot' or 'following'
            sortBy = 'popular' // 'newest', 'oldest', 'popular'
        } = req.query;

        const pageNum = Number(page);
        const limitNum = Math.max(Number(limit), 10); // Đảm bảo ít nhất 10 posts
        const start = (pageNum - 1) * limitNum;
        const end = start + limitNum - 1;

        const isHotFeed = type === 'hot';
        let isSavedFeed = type === 'saved';

        let posts = [];
        let cachedPosts = [];
        let fromCache = false;
        let fromDatabase = false;
        // Tính tổng số documents
        let totalDocs = 0;

        // ===== CASE: type = saved =====
        if (isSavedFeed) {
            // Lấy danh sách ID bài đã lưu
            const user = await User.findById(userId).select('bookmarks').lean();
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const savedIds = user.bookmarks || [];
            if (savedIds.length === 0) {
                return res.json({
                    page: pageNum,
                    totalPages: 0,
                    total: 0,
                    posts: [],
                    success: true,
                    feedType: 'saved'
                });
            }
            // Query post đã bookmark
            posts = await Post.find({ _id: { $in: savedIds } })
                .populate('author', 'username profilePicture fullName verified')
                .populate({
                    path: 'comments',
                    populate: { path: 'author', select: 'username profilePicture' }
                })
                .skip(start)
                .limit(limitNum)
                .lean();

            totalDocs = savedIds.length;
            const totalPages = Math.ceil(totalDocs / limitNum);

            return res.json({
                page: pageNum,
                totalPages,
                total: totalDocs,
                posts,
                success: true,
                feedType: 'saved',
                sortBy
            });
        }

        // Chọn Redis key
        const key = isHotFeed ? `feed:hot` : `feed:${userId}`;

        // Lấy dữ liệu từ Redis list
        const rawPosts = await client.lRange(key, start, end);

        // Parse posts từ Redis nếu có
        if (rawPosts && rawPosts.length > 0) {
            cachedPosts = rawPosts.map(post => {
                try {
                    return JSON.parse(post);
                } catch (parseError) {
                    console.error('Error parsing post from Redis:', parseError);
                    return null;
                }
            }).filter(post => post !== null);

            fromCache = true;
        }

        // Tính số posts còn thiếu để đảm bảo ít nhất limitNum posts
        const remainingNeeded = Math.max(limitNum - cachedPosts.length, 0);

        if (remainingNeeded > 0) {
            fromDatabase = true;

            // Lấy IDs của posts đã có trong cache để exclude
            const cachedPostIds = cachedPosts.map(post => post._id || post.id).filter(Boolean);

            // Build query dựa trên type feed
            let queryConditions = {};

            if (isHotFeed) {
                // Hot feed: lấy tất cả posts không cần theo dõi
                queryConditions = {
                    // Exclude posts đã có trong cache
                    ...(cachedPostIds.length > 0 && { _id: { $nin: cachedPostIds } })
                    // Không filter theo following cho hot feed
                };
            } else {
                // Following feed: chỉ lấy posts từ người follow
                const following = await getUserFollowing(userId);

                queryConditions = {
                    // Exclude posts đã có trong cache
                    ...(cachedPostIds.length > 0 && { _id: { $nin: cachedPostIds } }),
                    $or: [
                        { author: { $in: following } }, // Posts từ người follow
                        { mentions: userId }, // Posts mention user
                        { author: userId } // Posts của chính user
                    ]
                };
            }

            // Xác định sort order dựa trên sortBy
            let sortOrder = {};
            switch (sortBy) {
                case 'oldest':
                    sortOrder = { createdAt: 1 };
                    break;
                case 'popular':
                    sortOrder = {
                        interactions: -1,
                        likes: -1,
                        createdAt: -1
                    };
                    break;
                case 'newest':
                default:
                    sortOrder = { createdAt: -1 };
                    break;
            }

            // Tính skip - nếu có cache thì không skip, nếu không thì skip theo page
            const dbSkip = cachedPosts.length > 0 ? 0 : start;

            // Tăng limit để đảm bảo có đủ posts sau khi populate
            const bufferLimit = Math.max(remainingNeeded * 1.5, remainingNeeded + 5);

            // Query posts từ MongoDB với buffer
            let additionalPosts = await Post.find(queryConditions)
                .populate('author', 'username profilePicture fullName verified')
                .populate({
                    path: 'comments',
                    populate: {
                        path: 'author',
                        select: 'username profilePicture'
                    }
                })
                .sort(sortOrder)
                .skip(dbSkip)
                .limit(bufferLimit)
                .lean();

            // Nếu vẫn không đủ và đây là following feed, fallback sang tất cả posts
            if (additionalPosts.length < remainingNeeded && !isHotFeed) {
                const fallbackPosts = await Post.find({
                    ...(cachedPostIds.length > 0 && { _id: { $nin: [...cachedPostIds, ...additionalPosts.map(p => p._id)] } })
                })
                    .populate('author', 'username profilePicture fullName verified')
                    .populate({
                        path: 'comments',
                        populate: {
                            path: 'author',
                            select: 'username profilePicture'
                        }
                    })
                    .sort(sortOrder)
                    .limit(remainingNeeded - additionalPosts.length)
                    .lean();

                additionalPosts = [...additionalPosts, ...fallbackPosts];
            }

            // Đảm bảo chỉ lấy số lượng cần thiết
            additionalPosts = additionalPosts.slice(0, remainingNeeded);

            // Trộn posts: cache trước, database sau
            posts = [...cachedPosts, ...additionalPosts];
        } else {
            // Cache đủ rồi, chỉ dùng cache
            posts = cachedPosts;
        }

        // Đảm bảo có ít nhất limitNum posts
        if (posts.length < limitNum) {
            console.warn(`⚠️ Only found ${posts.length} posts, expected ${limitNum}`);

            // Nếu vẫn không đủ, lấy thêm từ database không filter
            const missingCount = limitNum - posts.length;
            const existingPostIds = posts.map(p => p._id || p.id).filter(Boolean);

            const fillPosts = await Post.find({
                _id: { $nin: existingPostIds }
            })
                .populate('author', 'username profilePicture fullName verified')
                .populate({
                    path: 'comments',
                    populate: {
                        path: 'author',
                        select: 'username profilePicture'
                    }
                })
                .sort({ createdAt: -1 })
                .limit(missingCount)
                .lean();

            posts = [...posts, ...fillPosts];
        }


        if (isHotFeed) {
            totalDocs = limit;
        } else {
            // Following feed: ưu tiên lấy từ Redis length
            try {
                totalDocs = await client.lLen(key);

                // Nếu cache rỗng, fallback sang database count
                if (totalDocs === 0) {
                    const following = await getUserFollowing(userId);
                    totalDocs = await Post.countDocuments({
                        $or: [
                            { author: { $in: following } },
                            { mentions: userId },
                            { author: userId }
                        ]
                    });

                    // Nếu vẫn không có posts từ following, dùng tổng số posts
                    if (totalDocs === 0) {
                        totalDocs = await Post.countDocuments({});
                    }
                }
            } catch (redisError) {
                console.error('Redis lLen error, falling back to DB count:', redisError);
                const following = await getUserFollowing(userId);
                totalDocs = await Post.countDocuments({
                    $or: [
                        { author: { $in: following } },
                        { mentions: userId },
                        { author: userId }
                    ]
                }) || await Post.countDocuments({});
            }
        }

        const totalPages = Math.ceil(totalDocs / limitNum);

        // Đảm bảo chỉ trả về đúng số lượng yêu cầu
        const finalPosts = posts.slice(0, limitNum);

        // Response format
        res.json({
            page: pageNum,
            totalPages,
            total: totalDocs,
            posts: finalPosts,
            success: true,
            feedType: isHotFeed ? 'hot' : 'following',
            sortBy: sortBy,
            dataSource: {
                fromCache: cachedPosts.length,
                fromDatabase: fromDatabase ? finalPosts.length - cachedPosts.length : 0,
                total: finalPosts.length,
                cacheHitRate: `${Math.round((cachedPosts.length / Math.max(limitNum, 1)) * 100)}%`,
                guaranteed: finalPosts.length >= limitNum ? 'Yes' : `No (${finalPosts.length}/${limitNum})`
            }
        });

    } catch (err) {
        console.error('❌ Error in getAllPost:', err);
        res.status(500).json({
            error: 'Server error',
            success: false,
            message: err.message
        });
    }
};

const getUserFollowing = async (userId) => {
    try {
        const user = await User.findById(userId).select('following');
        return user?.following || [];

    } catch (error) {
        console.error('Error getting user following:', error);
        return [];
    }
};

export const getUserPost = async (req, res) => {
    try {
        const authorId = req.id;
        const posts = await Post.find({ author: authorId }).sort({ createdAt: -1 }).populate({
            path: 'author',
            select: 'username, profilePicture'
        }).populate({
            path: 'comments',
            sort: { createdAt: -1 },
            populate: {
                path: 'author',
                select: 'username, profilePicture'
            }
        });
        return res.status(200).json({
            posts,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
export const likePost = async (req, res) => {
    try {
        const userDoAction = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        await post.updateOne({ $addToSet: { likes: userDoAction } }, { $inc: { interactions: 2 } });
        await post.save();

        const sender = await User.findById(userDoAction).select('username profilePicture createdAt');

        const postOwnerId = post.author.toString();

        // lưu thông báo vào DB
        const newNotification = await Notification.create({
            recipient: post.author,
            sender: userDoAction,
            type: "like",
            post: post._id,
            message: "đã thích bài viết của bạn."
        });


        if (postOwnerId !== userDoAction) {
            // const notification = {
            //     type: 'like',
            //     userId: userDoAction,
            //     userDetails: sender,
            //     postId,
            //     message: 'Your post was liked'
            // }
            // const postOwnerSocketId = getReceiverSocketId(postOwnerId);
            // io.to(postOwnerSocketId).emit('notification', notification);
            // gửi socket
            const notificationData = {
                _id: newNotification._id,
                type: notificationType.LIKE,
                sender: sender,
                post: post,
                message: "đã thích bài viết của bạn.",
                createdAt: moment().format("DD-MM-YYYY HH:mm:ss")
            };
            await SocketService.sendNotification(postOwnerId, notificationData)
        }

        await updateHotScoreOnInteraction(postId, 'like');

        return res.status(200).json({ message: 'Post liked', success: true });
    } catch (error) {
        console.log(error);

    }
}
export const dislikePost = async (req, res) => {
    try {
        const userDoAction = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        await post.updateOne({ $pull: { likes: userDoAction } }, { $inc: { interactions: -2 } });
        await post.save();

        const user = await User.findById(userDoAction).select('username profilePicture');
        const postOwnerId = post.author.toString();
        if (postOwnerId !== userDoAction) {
            const notification = {
                type: 'dislike',
                userId: userDoAction,
                userDetails: user,
                postId,
                message: 'Your post was disliked'
            }
            const postOwnerSocketId = getReceiverSocketId(postOwnerId);
            io.to(postOwnerSocketId).emit('notification', notification);
        }



        return res.status(200).json({ message: 'Post disliked', success: true });
    } catch (error) {

    }
}
export const addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const commentKrneWalaUserKiId = req.id;

        const { text } = req.body;

        const post = await Post.findById(postId);

        if (!text) return res.status(400).json({ message: 'text is required', success: false });

        const comment = await Comment.create({
            text,
            author: commentKrneWalaUserKiId,
            post: postId
        })

        await comment.populate({
            path: 'author',
            select: "username profilePicture"
        });

        post.comments.push(comment._id);
        post.interactions += 2;
        await post.save();

        await updateHotScoreOnInteraction(postId, 'comment');

        return res.status(201).json({
            message: 'Comment Added',
            comment,
            success: true
        })

    } catch (error) {
        console.log(error);
    }
};
export const likeComment = async (req, res) => {
    try {
        const userLikeCommentId = req.id
        const commentId = req.params.id

        const comment = await Comment.findById(commentId)
        if (!comment) {
            const commentWithReply = await Comment.findOne({ "replies._id": commentId });
            if (commentWithReply) {
                const reply = commentWithReply.replies.id(commentId);
                if (reply) {
                    if (!reply.likes.includes(userLikeCommentId)) {
                        await Comment.findByIdAndUpdate(
                            commentWithReply._id,
                            { $addToSet: { "replies.$[reply].likes": userLikeCommentId } },
                            { arrayFilters: [{ "reply._id": commentId }], new: true }
                        );

                        const user = await User.findById(userLikeCommentId).select("username profilePicture")
                        const commentOwnerId = reply.author.toString()

                        if (userLikeCommentId != commentOwnerId) {
                            const notification = {
                                type: 'like comment',
                                userId: userLikeCommentId,
                                userDetails: user,
                                commentId,
                                message: 'comment was liked'
                            }
                            const commentOwnerSocketId = getReceiverSocketId(commentOwnerId)
                            io.to(commentOwnerSocketId).emit('notification', notification)
                        }
                        const post = await Post.findOne({ "comments._id": commentWithReply._id })
                        if (post) {
                            post.interactions += 1
                            post.save()
                        }
                        return res.status(200).json({ message: 'Comment liked', success: true });
                    } else {
                        return res.status(200).json({ message: 'You have already liked this comment', success: false });
                    }
                }
            } else {
                return res.status(404).json({ message: 'Comment not found', success: false });
            }
        }
        await comment.updateOne({ $addToSet: { likes: userLikeCommentId } })

        const user = await User.findById(userLikeCommentId).select("username profilePicture")
        const commentOwnerId = comment.author.toString()

        if (userLikeCommentId != commentOwnerId) {
            const notification = {
                type: 'like comment',
                userId: userLikeCommentId,
                userDetails: user,
                commentId,
                message: 'comment was liked'
            }
            const commentOwnerSocketId = getReceiverSocketId(commentOwnerId)
            io.to(commentOwnerSocketId).emit('notification', notification)
        }
        const post = await Post.findOne({ "comments._id": commentId })
        if (post) {
            post.interactions += 1
            post.save()
        }
        return res.status(200).json({ message: 'Comment liked', success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
};
export const dislikeComment = async (req, res) => {
    try {
        const userDislikeCommentId = req.id
        const commentId = req.params.id

        const comment = await Comment.findById(commentId)
        if (!comment) {
            const commentWithReply = await Comment.findOne({ "replies._id": commentId });
            if (commentWithReply) {
                const reply = commentWithReply.replies.id(commentId);
                if (reply) {
                    if (reply.likes.includes(userDislikeCommentId)) {

                        await Comment.findByIdAndUpdate(
                            commentWithReply._id,
                            { $pull: { "replies.$[reply].likes": userDislikeCommentId } },
                            { arrayFilters: [{ "reply._id": commentId }], new: true }
                        );

                        const user = await User.findById(userDislikeCommentId).select("username profilePicture")
                        const commentOwnerId = reply.author.toString()

                        if (userDislikeCommentId != commentOwnerId) {
                            const notification = {
                                type: 'dislike comment',
                                userId: userDislikeCommentId,
                                userDetails: user,
                                commentId,
                                message: 'comment was disliked'
                            }
                            const commentOwnerSocketId = getReceiverSocketId(commentOwnerId)
                            io.to(commentOwnerSocketId).emit('notification', notification)
                        }
                        const post = await Post.findOne({ "comments._id": commentWithReply._id })
                        if (post) {
                            post.interactions -= 1
                            post.save()
                        }
                        return res.status(200).json({ message: 'Comment disliked', success: true });
                    } else {
                        return res.status(200).json({ message: 'You have not liked this comment yet', success: false });
                    }
                }
            } else {
                return res.status(404).json({ message: 'Comment not found', success: false });
            }
        }
        await comment.updateOne({ $pull: { likes: userDislikeCommentId } })

        const user = await User.findById(userDislikeCommentId).select("username profilePicture")
        const commentOwnerId = comment.author.toString()

        if (userDislikeCommentId != commentOwnerId) {
            const notification = {
                type: 'dislike comment',
                userId: userDislikeCommentId,
                userDetails: user,
                commentId,
                message: 'comment was disliked'
            }
            const commentOwnerSocketId = getReceiverSocketId(commentOwnerId)
            io.to(commentOwnerSocketId).emit('notification', notification)
        }
        const post = await Post.findOne({ "comments._id": commentId })
        if (post) {
            post.interactions -= 1
            post.save()
        }
        return res.status(200).json({ message: 'Comment disliked', success: true });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error', success: false });
    }
};
export const replyComment = async (req, res) => {
    try {
        const userReplyId = req.id
        const commentId = req.params.id
        const { text } = req.body

        const comment = await Comment.findById(commentId)
        if (!text) return res.status(400).json({ message: 'text is required', success: false });
        const replyComment = {
            text: text,
            author: userReplyId
        }
        comment.replies.push(replyComment);
        await comment.save()

        await comment.populate([
            {
                path: 'author',
                select: "username profilePicture"
            },
            {
                path: 'replies.author',
                select: "username profilePicture"
            }
        ]
        );

        return res.status(201).json({
            message: 'reply comment added',
            comment,
            success: true
        })
    } catch (error) {
        console.log(error)
    }
};
export const getCommentsOfPost = async (req, res) => {
    try {
        const postId = req.params.id;

        const comments = await Comment.find({ post: postId }).populate('author', 'username profilePicture');

        if (!comments) return res.status(404).json({ message: 'No comments found for this post', success: false });

        return res.status(200).json({ success: true, comments });

    } catch (error) {
        console.log(error);
    }
}
export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        // check if the logged-in user is the owner of the post
        if (post.author.toString() !== authorId) return res.status(403).json({ message: 'Unauthorized' });

        // delete post
        await Post.findByIdAndDelete(postId);

        // remove the post id from the user's post
        let user = await User.findById(authorId);
        user.posts = user.posts.filter(id => id.toString() !== postId);
        await user.save();

        // delete associated comments
        await Comment.deleteMany({ post: postId });

        return res.status(200).json({
            success: true,
            message: 'Post deleted'
        })

    } catch (error) {
        console.log(error);
    }
}
export const bookmarkPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        const user = await User.findById(authorId);
        if (user.bookmarks.includes(post._id)) {
            await user.updateOne({ $pull: { bookmarks: post._id } });
            await user.save();
            await post.updateOne({ $pull: { bookmarks: authorId } }, { $inc: { interactions: -2 } });
            await post.save();
            return res.status(200).json({ type: 'unsaved', message: 'Post removed from bookmark', success: true });

        } else {
            await user.updateOne({ $addToSet: { bookmarks: post._id } });
            await user.save();
            await post.updateOne({ $addToSet: { bookmarks: authorId } }, { $inc: { interactions: +2 } });
            await post.save();
            return res.status(200).json({ type: 'saved', message: 'Post bookmarked', success: true });
        }

    } catch (error) {
        console.log(error);
    }
}
export const readPost = async (req, res) => {
    try {
        const userId = req.id
        const { postId } = req.body

        await Post.updateOne(
            { _id: postId, read: { $ne: userId } },
            { $addToSet: { read: userId } }
        );

        await updateHotScoreOnInteraction(postId, 'share');

        return res.status(200).json({ type: 'read', message: `post read`, success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error updating read posts', error: error.message });
    }
}

export const buildHotFeedCache = async () => {
    try {
        console.log('🔥 Building hot feed cache...');

        const key = 'feed:hot';

        // Strategy 1: Fresh build - lấy posts trending trong 10000h
        const timeThreshold = new Date(Date.now() - 10000 * 60 * 60 * 1000);

        const hotPosts = await Post.find({
            createdAt: { $gte: timeThreshold }
        })
            .populate('author', 'username profilePicture fullName verified')
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                },
            })
            // Sắp xếp theo algorithm hot score
            .sort({
                interactions: -1,      // Interactions cao nhất
                createdAt: -1          // Thời gian mới nhất
            })
            .limit(500)
            .lean();

        if (hotPosts.length > 0) {
            // Tính hot score và sort lại
            const scoredPosts = hotPosts.map(post => {
                const ageHours = (Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60);
                const likesCount = post.likes?.length || 0;
                const commentsCount = post.comments?.length || 0;
                const interactions = post.interactions || 0;

                // Hot score algorithm: (likes * 3 + comments * 5 + interactions) / (age + 2)^1.8
                const hotScore = (likesCount * 3 + commentsCount * 5 + interactions) / Math.pow(ageHours + 2, 1.8);

                return {
                    ...post,
                    hotScore
                };
            }).sort((a, b) => b.hotScore - a.hotScore);

            const postsJson = scoredPosts.map(post => {
                const { hotScore, ...postData } = post;
                return JSON.stringify(postData);
            });

            // Atomic replace cache
            const pipeline = client.multi();
            pipeline.del(key);
            pipeline.lPush(key, ...postsJson);
            pipeline.expire(key, 60 * 30); // Cache 30 phút cho hot feed
            await pipeline.exec();

            console.log(`🔥 Hot feed cache built with ${hotPosts.length} posts (hot score algorithm)`);
        } else {
            console.log('🔥 No trending posts found, keeping existing cache');
        }
    } catch (error) {
        console.error('❌ Error building hot feed cache:', error);
    }
};

// Function để update hot feed khi có post mới có potential viral
export const updateHotFeedOnNewPost = async (postId) => {
    try {
        // Chỉ update nếu post đạt threshold nhất định
        const post = await Post.findById(postId)
            .populate('author', 'username profilePicture fullName verified')
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                },
            })
            .lean();

        if (!post) return;

        const likesCount = post.likes?.length || 0;
        const commentsCount = post.comments?.length || 0;
        const interactions = post.interactions || 0;

        // Threshold: ít nhất 3 likes hoặc 2 comments hoặc 5 interactions trong 1h đầu
        const ageHours = (Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60);
        const isViral = ageHours <= 1 && (likesCount >= 3 || commentsCount >= 2 || interactions >= 5);

        if (isViral) {
            const key = 'feed:hot';
            const postData = JSON.stringify(post);

            // Thêm vào đầu hot feed
            await client.lPush(key, postData);
            // Trim để giữ 500 posts
            await client.lTrim(key, 0, 499);
            // Refresh TTL
            await client.expire(key, 60 * 60 * 2);

            console.log(`🚀 Viral post ${postId} added to hot feed`);
        }
    } catch (error) {
        console.error('❌ Error updating hot feed on new post:', error);
    }
};

// Function để increment hot score khi có interaction
export const updateHotScoreOnInteraction = async (postId, interactionType) => {
    try {
        const key = 'feed:hot';
        const listLength = await client.lLen(key);

        if (listLength === 0) return;

        // Tìm post trong cache và update score
        const posts = await client.lRange(key, 0, -1);
        let postIndex = -1;
        let updatedPost = null;

        for (let i = 0; i < posts.length; i++) {
            const post = JSON.parse(posts[i]);
            if (post._id === postId) {
                postIndex = i;

                // Update interaction counts
                switch (interactionType) {
                    case 'like':
                        post.interactions = (post.interactions || 0) + 1;
                        break;
                    case 'comment':
                        post.interactions = (post.interactions || 0) + 2;
                        break;
                    case 'share':
                        post.interactions = (post.interactions || 0) + 3;
                        break;
                }

                updatedPost = post;
                break;
            }
        }

        if (postIndex >= 0 && updatedPost) {
            // Update post tại vị trí cũ
            await client.lSet(key, postIndex, JSON.stringify(updatedPost));
            console.log(`🔥 Updated hot score for post ${postId} (${interactionType})`);
        }
    } catch (error) {
        console.error('❌ Error updating hot score:', error);
    }
};

// Function để clean up old cache entries
export const cleanupOldFeeds = async () => {
    try {
        console.log('🧹 Cleaning up old feed caches...');

        const pattern = 'feed:*';
        const keys = await client.keys(pattern);

        for (const key of keys) {
            const ttl = await client.ttl(key);

            // Nếu key không có TTL hoặc đã expired, xóa đi
            if (ttl === -1 || ttl === -2) {
                await client.del(key);
                console.log(`🗑️  Deleted expired key: ${key}`);
            }
        }
    } catch (error) {
        console.error('❌ Error cleaning up feeds:', error);
    }
};