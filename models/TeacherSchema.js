import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
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
    age: {
      type: Number,
      required: false,
    },
    assignedClasses:
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "class",
      },
  },
  { timestamps: true }
);

const TeacherModel = mongoose.model("teachers", teacherSchema);
export default TeacherModel;
