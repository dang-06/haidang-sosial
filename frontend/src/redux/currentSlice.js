import { createSlice } from "@reduxjs/toolkit";

const currentSlice = createSlice({
    name: 'current',
    initialState: {
        currentPage: null,
        isSidebarOpen: null,
        mode: 'light'
    },
    reducers: {
        setCurrentPage: (state, action) => {
            state.currentPage = action.payload
        },
        setIsSidebarOpen: (state, action) => {
            state.isSidebarOpen = action.payload
        },
        setMode: (state, action) => {
            state.mode = action.payload
        },
    }
})
export const { setCurrentPage, setIsSidebarOpen, setMode } = currentSlice.actions;
export default currentSlice.reducer