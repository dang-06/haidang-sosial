import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import e from "cors";

export const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const images = req.files;
        const authorId = req.id;
        const imageUploadPromises = images.map(async (image) => {
            const optimizedImageBuffer = await sharp(image.buffer)
                .resize({ width: 1000, height: 1000, fit: 'inside' })
                .toFormat('jpeg', { quality: 100 })
                .toBuffer();
            const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
            const cloudResponse = await cloudinary.uploader.upload(fileUri);
            return cloudResponse.secure_url;
        });
        const imageUrls = await Promise.all(imageUploadPromises);
        const post = await Post.create({
            caption,
            image: imageUrls,
            author: authorId
        });
        const user = await User.findById(authorId);
        if (user) {
            user.posts.push(post._id);
            await user.save();
        }
        await post.populate({ path: 'author', select: '-password' });
        return res.status(201).json({
            message: 'New post added',
            post,
            success: true,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'An error occurred', error: error.message });
    }
};
export const getAllPost = async (req, res) => {
    try {
        const limit = 5;
        const page = parseInt(req.query.page) || 1;

        const posts = await Post.find().sort({ createdAt: -1 })
            .limit(limit * page)
            .populate({ path: 'author', select: 'username profilePicture followers gender' })
            .populate({
                path: 'comments',
                options: { sort: { createdAt: -1 } },
                populate: [
                    {
                        path: 'author',
                        select: 'username profilePicture'
                    },
                    {
                        path: 'replies',
                        options: { sort: { createdAt: -1 } },
                        populate: {
                            path: 'author',
                            select: 'username profilePicture'
                        },
                    }
                ]
            });
        return res.status(200).json({
            posts,
            success: true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error retrieving posts',
            error: error.message,
            success: false
        });
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

        const user = await User.findById(userDoAction).select('username profilePicture createdAt');

        const postOwnerId = post.author.toString();
        if (postOwnerId !== userDoAction) {
            const notification = {
                type: 'like',
                userId: userDoAction,
                userDetails: user,
                postId,
                message: 'Your post was liked'
            }
            const postOwnerSocketId = getReceiverSocketId(postOwnerId);
            io.to(postOwnerSocketId).emit('notification', notification);
            console.log()
        }

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
            await post.updateOne({ $pull: { bookmarks: authorId } });
            await post.save();
            return res.status(200).json({ type: 'unsaved', message: 'Post removed from bookmark', success: true });

        } else {
            await user.updateOne({ $addToSet: { bookmarks: post._id } });
            await user.save();
            await post.updateOne({ $addToSet: { bookmarks: authorId } });
            await post.save();
            return res.status(200).json({ type: 'saved', message: 'Post bookmarked', success: true });
        }

    } catch (error) {
        console.log(error);
    }
}