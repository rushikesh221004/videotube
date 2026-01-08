import {asyncHandler} from "../utils/asyncHandler.util.js";

const registerUser = asyncHandler(async (req, res) => {
    return res.status(200).json({
        message: "okay"
    })
})

export { registerUser };
