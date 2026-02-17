import mongoose from "mongoose";

const attendenceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "students",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "class",
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Present",
      required: true,
    },
  },
  { timestamps: true }
);

const AttendenceModel = mongoose.model("attendences", attendenceSchema);
export default AttendenceModel;
