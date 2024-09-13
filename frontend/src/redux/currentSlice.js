import { createSlice } from "@reduxjs/toolkit";

const currentSlice = createSlice({
    name: 'current',
    initialState: {
        currentPage: null,
        isSidebarOpen: null
    },
    reducers: {
        setCurrentPage: (state, action) => {
            state.currentPage = action.payload
        },
        setIsSidebarOpen: (state, action) => {
            state.isSidebarOpen = action.payload
        },
    }
})
export const { setCurrentPage,setIsSidebarOpen } = currentSlice.actions;
export default currentSlice.reducer