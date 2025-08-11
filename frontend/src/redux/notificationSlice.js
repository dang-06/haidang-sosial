import { createSlice } from "@reduxjs/toolkit";
const notificationSlice = createSlice({
    name:'notification',
    initialState:{
        notifications:[],
    },
    reducers:{
        //actions
        setnotifications:(state,action) => {
            state.notifications = action.payload;
        },
    }
});
export const {setnotifications} = notificationSlice.actions;
export default notificationSlice.reducer;