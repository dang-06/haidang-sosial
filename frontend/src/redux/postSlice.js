import { createSlice } from "@reduxjs/toolkit";
const postSlice = createSlice({
    name:'post',
    initialState:{
        posts:[],
        selectedPost:null,
    },
    reducers:{
        //actions
        setPosts:(state,action) => {
            state.posts = action.payload;
        },
        setSelectedPost:(state,action) => {
            state.selectedPost = action.payload;
        },
        appendPosts: (state, action) => {
            state.posts = [...state.posts, ...action.payload];
          },
    }
});
export const {setPosts, setSelectedPost, appendPosts} = postSlice.actions;
export default postSlice.reducer;