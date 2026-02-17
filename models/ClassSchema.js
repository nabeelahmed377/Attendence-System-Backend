import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "students",
      },
    ],
  },
  { timestamps: true }
);

const ClassModel = mongoose.model("class", classSchema);
export default ClassModel;
