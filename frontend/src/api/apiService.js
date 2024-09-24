import axiosClient from './axiosClient';

export const sendComment = async (postId, text) => {
    const response = await axiosClient.post(`/post/${postId}/comment`, { text });
    return response;
};