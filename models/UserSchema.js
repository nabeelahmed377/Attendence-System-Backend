import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    contact: {
      type: Number,
      required: false,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female"],
    },
    role: {
      type: String,
      enum: ["admin", "teacher"],
      required: true,
    },
    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "class",
      },
    ],
  },
  { timestamps: true }
);

const UserModel = mongoose.model("users", userSchema);
export default UserModel;
