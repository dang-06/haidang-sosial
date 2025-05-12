import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb://localhost:27017,localhost:27018,localhost:27019/haidang-social?replicaSet=rs0";

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