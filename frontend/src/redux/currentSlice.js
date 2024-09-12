import { createSlice } from "@reduxjs/toolkit";

const currentSlice = createSlice({
    name: 'current',
    initialState: {
        currentPage: null
    },
    reducers: {
        setCurrentPage: (state, action) => {
            state.currentPage = action.payload
        },
    }
})
export const { setCurrentPage } = currentSlice.actions;
export default currentSlice.reducer