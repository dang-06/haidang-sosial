import { getUserByUsername } from '@/api/apiService';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// This function parses the mentions in the text
export const parseMentions = (text) => {
    const parts = text.split(/(@\w+)/);
    return parts.map((part, index) => {
        if (part.startsWith('@')) {
            const username = part.slice(1);
            return (
                <MentionedUser key={index} username={username} />
            );
        }
        return part;
    });
};

const MentionedUser = ({ username }) => {
    const navigate = useNavigate();
    const handleClick = async () => {
        if (username) {
            try {
                const res = await getUserByUsername(username)
                console.log(res);
                if (res.success) {
                    const id = res.user._id
                    navigate(`/profile/${id}`)
                }
            } catch (error) {
                console.log(error);
            }
        }
    }
    return (
        <span
            className='text-maincolor cursor-pointer'
            onClick={handleClick}
        >
            {`@${username}`}
        </span>
    );
};
