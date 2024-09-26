import mongoose from "mongoose";
const postSchema = new mongoose.Schema({
    caption:{type:String, default:''},
    image: [{ type: String }],
    author:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
    likes:[{type:mongoose.Schema.Types.ObjectId, ref:'User'}],
    comments:[{type:mongoose.Schema.Types.ObjectId, ref:'Comment'}],
    bookmarks:[{type:mongoose.Schema.Types.ObjectId, ref:'User'}],
    interactions: { type: Number, default: 0 },
},{
    timestamps: true
});
export const Post = mongoose.model('Post', postSchema);