import app from "./app.js";
import connectDb from "./db/db.connect.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 4000;

const startServer = async () => {
    await connectDb();

    app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}`);
    })
}

startServer();