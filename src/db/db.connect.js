import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`);
        console.log(`db connected : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log(`connection failed with db : ${error?.message}`);
        process.exit();
    }
}

export default connectDb;