import mongoose from "mongoose";
import dotenv from "dotenv";
import { dbName } from "../constants.js";

dotenv.config()

const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${dbName}`);
        console.log(`connected to db : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log(`connection failed with mongoose : ${error?.message}`);
        process.exit(1);
    }
}

export default connectDb;
