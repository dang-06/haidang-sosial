import { parseMentions } from '@/lib/utils/mentionParser';
import React, { createContext, useContext } from 'react';

const MentionContext = createContext();

export const MentionProvider = ({ children }) => {
    const value = { parseMentions };
    return (
        <MentionContext.Provider value={value}>
            {children}
        </MentionContext.Provider>
    );
};

export const useMention = () => {
    return useContext(MentionContext);
};