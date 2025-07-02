import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true,
        },
        channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model (the channel being subscribed to)
        required: true,
        },
        createdAt: {
        type: Date,
        default: Date.now,
        },
    },
    {
        timestamps: true, // Automatically manage createdAt and updatedAt fields
    }
    );
const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;