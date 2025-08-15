import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb+srv://dominhhaidang2002:Haidang2002@haidang-social.26fju.mongodb.net/?retryWrites=true&w=majority&appName=haidang-social";

        const connection = await mongoose.connect(uri, {
            readPreference: "secondary",
        });

        console.log("MongoDB connected successfully to haidang-social.");
        return connection;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

export default connectDB;