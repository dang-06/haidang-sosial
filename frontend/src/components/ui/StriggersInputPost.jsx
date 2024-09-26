import React, { useEffect, useRef, useState } from "react";
import data from "@emoji-mart/data";
import { Picker } from "emoji-mart";
import { useSelector } from "react-redux";
import { Avatar } from "@mui/material";
import { Textarea, TextareaComment } from './textarea';
import { Button } from './button'
import { GrEmoji } from "react-icons/gr";
import { getAllUsers } from "@/api/apiService";


export default function TriggersInputPost({ setText }) {
    const [value, setValue] = useState('');
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [multipleSuggestions, setMultipleSuggestions] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(null);
    const tagSuggestions = ['primereact', 'primefaces', 'primeng', 'primevue'];
    const pickerRef = useRef(null);
    const inputRef = useRef(null);
    const iconRef = useRef(null);

    const fetchUsers = async (username = '') => {
        try {
            const res = await getAllUsers(username);
            if (res.success) {
                setSuggestedUsers(res.users);
            }
        } catch (error) {
            console.log("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onInputChange = (e) => {
        const inputValue = e.target.value;
        setValue(inputValue);
        setText(inputValue)

        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;

        const cursorIndex = e.target.selectionStart;
        setCursorPosition(cursorIndex);

        const beforeCursor = inputValue.slice(0, cursorIndex);

        const match = beforeCursor.match(/[@#][\w]*$/);

        const trigger = match ? match[0][0] : null;

        const charBeforeCursor = inputValue[cursorIndex - 1];

        if (trigger) {
            const query = inputValue.slice(0, cursorIndex).split(trigger).pop().toLowerCase().trim();
            onMultipleSearch(trigger, query);
        } else if (charBeforeCursor === ' ' || !inputValue) {
            setMultipleSuggestions([]);
        }
    };

    const onMultipleSearch = async (trigger, query) => {
        if (trigger === '@') {
            const res = await getAllUsers(query);
            let suggestions = suggestedUsers
            if (res.success) {
                suggestions = res.users
            }

            setMultipleSuggestions(suggestions);
        } else if (trigger === '#') {
            const suggestions = query.length
                ? tagSuggestions.filter(tag => tag.toLowerCase().startsWith(query))
                : tagSuggestions;
            setMultipleSuggestions(suggestions);
        }
    };

    const handleSuggestionClick = (suggestion, trigger) => {
        const mentionText = trigger === '@' ? `${suggestion.username}` : `${suggestion}`;
        const beforeCursor = value.slice(0, cursorPosition);
        const afterCursor = value.slice(cursorPosition);

        setValue(`${beforeCursor}${mentionText} ${afterCursor}`);
        setMultipleSuggestions([]);
        inputRef.current.focus();
    };

    const itemTemplate = (suggestion) => (
        <div className="flex align-items-center gap-1 mb-1" onClick={() => handleSuggestionClick(suggestion, '@')}>
            <Avatar alt={suggestion.username} src={suggestion.profilePicture} style={{ width: '32px', height: '32px' }} />
            <span className="flex flex-col ml-2">{suggestion.username}</span>
        </div>
    );

    const tagTemplate = (tag) => (
        <div onClick={() => handleSuggestionClick(tag, '#')}>
            <span>{tag}</span>
        </div>
    );

    useEffect(() => {
        if (showEmojiPicker && pickerRef.current) {
            new Picker({
                parent: pickerRef.current,
                data: data,
                emojiButtonSize: 35,
                emojiSize: 20,
                emojiButtonColors: ['rgba(102, 51, 153, .2)'],
                icons: 'outline',
                locale: 'vi',
                skin: 6,
                onEmojiSelect: (emoji) => {
                    const emojiText = emoji.native;
                    const beforeCursor = value.slice(0, cursorPosition);
                    const afterCursor = value.slice(cursorPosition);
                    setValue(prevValue => `${prevValue}${emojiText}`);
                    inputRef.current.focus();
                }
            });
        }

        const handleClickOutside = (event) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target) &&
                !inputRef.current.contains(event.target) &&
                !iconRef.current.contains(event.target)
            ) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    return (
        <div className="card flex items-center justify-content-center relative" style={{ width: '100%' }}>
            <TextareaComment
                className="focus-visible:ring-transparent border-none overflow-hidden reative"
                ref={inputRef}
                value={value}
                onChange={onInputChange}
                placeholder="Bạn đang có điều gì muốn chia sẻ với mọi người?"
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <div ref={iconRef} className="emoji-button absolute right-0.5 flex items-center cursor-pointer"><GrEmoji onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="" /></div>
            {showEmojiPicker && (
                <div ref={pickerRef} style={{ position: 'absolute', bottom: '40px', right: '0', minHeight: '400px', maxHeight: '600px' }} />
            )}
            {multipleSuggestions.length > 0 && (
                <div className="suggestions-box w-[350px] max-h-[350px] bottom-[36px] overflow-auto rounded shadow cursor-pointer " style={{ position: 'absolute', zIndex: 1000, backgroundColor: 'white', border: '1px solid #ddd' }}>
                    {multipleSuggestions.map(suggestion => (
                        <div key={suggestion.username} className=" p-2 hover:bg-maincolor/25"> {suggestion.username ? itemTemplate(suggestion) : tagTemplate(suggestion)}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
