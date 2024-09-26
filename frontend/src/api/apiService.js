import axiosClient from './axiosClient';

export const sendComment = async (postId, text) => {
    const response = await axiosClient.post(`/post/${postId}/comment`, { text });
    return response;
};

export const getUserByUsername = async (username) => {
    const response = await axiosClient.post(`/user/detail`,{username});
    return response.data;
};

export const getPost = async (page) => {
    const response = await axiosClient.get(`/post/all?page=${page}`);
    return response.data;
};

export const followOrUnfollow = async (userId) => {
    const response = await axiosClient.post(`/user/followorunfollow/${userId}`);
    return response.data;
};

export const getAllUsers = async (username = '', limit = 7) => {
    const response = await axiosClient.get(`/user/all-users?username=${username}&&limit=${limit}`);
    return response.data;
};

export const replyComment = async (id, text) => {
    const response = await axiosClient.post(`/post/${id}/reply-comment`,{text});
    return response.data;
};

export const getLoginStatus = async () => {
    const response = await axiosClient.get(`user/status`);
    return response.data;
};