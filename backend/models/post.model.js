import mongoose from "mongoose";
const postSchema = new mongoose.Schema({
    caption:{type:String, default:''},
    image: [{ type: String }],
    author:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
    likes:[{type:mongoose.Schema.Types.ObjectId, ref:'User'}],
    comments:[{type:mongoose.Schema.Types.ObjectId, ref:'Comment'}],
    bookmarks:[{type:mongoose.Schema.Types.ObjectId, ref:'User'}],
    interactions: { type: Number, default: 0 },
    read: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    mentions:[{type:mongoose.Schema.Types.ObjectId, ref:'User'}]
},{
    timestamps: true
});

postSchema.index({ read: 1, createdAt: -1, interactions: -1 });

export const Post = mongoose.model('Post', postSchema);