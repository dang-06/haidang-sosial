import React, { useEffect, useRef, useState } from "react";
import data from "@emoji-mart/data";
import { Picker } from "emoji-mart";
import { useSelector } from "react-redux";
import { Avatar } from "@mui/material";
import { Textarea, TextareaComment } from './textarea';
import { Button } from '../ui/button'
import { GrEmoji } from "react-icons/gr";


export default function TriggersInput({ sendMessageHandler }) {
    const [value, setValue] = useState('');
    const { suggestedUsers } = useSelector(store => store.auth);
    const [multipleSuggestions, setMultipleSuggestions] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(null);
    const tagSuggestions = ['primereact', 'primefaces', 'primeng', 'primevue'];
    const pickerRef = useRef(null);
    const inputRef = useRef(null);
    const iconRef = useRef(null);

    const onInputChange = (e) => {
        const inputValue = e.target.value;
        setValue(inputValue);

        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;

        const cursorIndex = e.target.selectionStart;
        setCursorPosition(cursorIndex);

        const lastChar = inputValue[cursorIndex - 1];
        const trigger = lastChar === '@' || lastChar === '#' ? lastChar : null;

        if (trigger) {
            const query = inputValue.slice(0, cursorIndex).split(trigger).pop().toLowerCase();
            onMultipleSearch(trigger, query);
        } else {
            setMultipleSuggestions([]);
        }
    };

    const onMultipleSearch = (trigger, query) => {
        if (trigger === '@') {
            const suggestions = query.length
                ? suggestedUsers.filter(user => user.username.toLowerCase().startsWith(query))
                : suggestedUsers;
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

    const handleSendMessage = () => {
        if (value.trim()) {
            sendMessageHandler(value);
            setValue('');
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = '38px'; 
        }
    };

    useEffect(() => {
        if (showEmojiPicker && pickerRef.current) {
            new Picker({
                parent: pickerRef.current,
                data: data,
                emojiButtonSize: 40,
                emojiSize: 30,
                emojiButtonColors: ['rgba(102, 51, 153, .2)'],
                icons: 'solid',
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
            // Check if the click is outside of the input and emoji picker
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
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && value.trim()) {
                        e.preventDefault();
                        handleSendMessage();
                    }
                }}
                className="focus-visible:ring-transparent border border-maincolor overflow-hidden reative"
                ref={inputRef}
                value={value}
                onChange={onInputChange}
                placeholder="Thêm bình luận"
                rows={1}
                style={{ width: '100%', boxSizing: 'border-box' }}
            />
            {/* <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="emoji-button absolute left-1 flex items-center"
                style={{ marginTop: '10px' }}
            >
                😊
            </button> */}
            <div ref={iconRef} className="emoji-button absolute left-2 flex items-center cursor-pointer"><GrEmoji  onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="" /></div>
            <Button className="absolute right-0.5 border-none h-5 text-maincolor hover:bg-white" disabled={!value.trim()} onClick={handleSendMessage} variant="outline">Đăng</Button>
            {showEmojiPicker && (
                <div ref={pickerRef} style={{ position: 'absolute', bottom: '40px', right: '0', minHeight: '400px', maxHeight: '600px' }} />
            )}
            {multipleSuggestions.length > 0 && (
                <div className="suggestions-box w-[350px] h-[350px] bottom-[36px] overflow-auto rounded shadow cursor-pointer " style={{ position: 'absolute', zIndex: 1000, backgroundColor: 'white', border: '1px solid #ddd' }}>
                    {multipleSuggestions.map(suggestion => (
                        <div key={suggestion.username} className=" p-2 hover:bg-maincolor/25"> {suggestion.username ? itemTemplate(suggestion) : tagTemplate(suggestion)}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
