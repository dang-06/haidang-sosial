import mongoose from "mongoose";

const connectPrimaryDB = async () => {
    try {
        const primaryConnection = await mongoose.connect(process.env.MONGO_URI);
        console.log("Primary MongoDB connected successfully.");
        return primaryConnection;
    } catch (error) {
        console.error("Primary DB connection error:", error);
        throw error;
    }
};

const connectSecondaryDB = async () => {
    try {
        const secondaryConnection = await mongoose.createConnection(process.env.MONGO_SECONDARY_URI, {
            readPreference: "secondary",
        });
        console.log("Secondary MongoDB connected successfully.");
        const client = secondaryConnection.getClient();
        console.log("Read Preference thực tế:", client.options.readPreference.mode);

        // Lấy thông tin server thực tế
        const serverInfo = await client.db().command({ serverStatus: 1 });
        console.log("Server info:", serverInfo.host, serverInfo.repl);

        const adminDb = client.db().admin();
        const status = await adminDb.command({ replSetGetStatus: 1 });
        console.log("Secondary node status:", status.myState === 2 ? "Secondary" : "Not Secondary (myState: " + status.myState + ")");
        return secondaryConnection;
    } catch (error) {
        console.error("Secondary DB connection error:", error);
        throw error;
    }
};

const connectDB = async () => {
    try {
        const primary = await connectPrimaryDB();
        const secondary = await connectSecondaryDB();
        return { primary, secondary };
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    }
};

export default connectDB;