import UserModel from "../models/UserSchema.js";
import ClassModel from "../models/ClassSchema.js";
import StudentModel from "../models/StudentSchema.js";
import AttendenceModel from "../models/AttendenceSchema.js";

// ============ CLASS MANAGEMENT ============

// Create a new class
export const createClass = async (req, res) => {
  try {
    const { className, classTeacherId } = req.body;

    // Verify teacher exists and is a teacher
    if (classTeacherId) {
      const teacher = await UserModel.findOne({
        _id: classTeacherId,
        role: "teacher",
      });
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
    }

    const newClass = new ClassModel({
      className,
      classTeacher: classTeacherId,
    });

    await newClass.save();

    // Update teacher's assigned classes
    if (classTeacherId) {
      await UserModel.findByIdAndUpdate(classTeacherId, {
        $push: { assignedClasses: newClass._id },
      });
    }

    res.status(201).json({
      message: "Class created successfully",
      class: newClass,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all classes
export const getAllClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find()
      .populate("classTeacher", "name email")
      .populate("students", "name rollNo");

    res.status(200).json({
      message: "Classes fetched successfully",
      count: classes.length,
      classes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign teacher to class
export const assignTeacherToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { teacherId } = req.body;

    const teacher = await UserModel.findOne({ _id: teacherId, role: "teacher" });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const classData = await ClassModel.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Remove class from old teacher if exists
    if (classData.classTeacher) {
      await UserModel.findByIdAndUpdate(classData.classTeacher, {
        $pull: { assignedClasses: classId },
      });
    }

    // Update class with new teacher
    classData.classTeacher = teacherId;
    await classData.save();

    // Add class to new teacher
    await UserModel.findByIdAndUpdate(teacherId, {
      $addToSet: { assignedClasses: classId },
    });

    res.status(200).json({
      message: "Teacher assigned successfully",
      class: classData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ STUDENT MANAGEMENT ============

// Create a new student
export const createStudent = async (req, res) => {
  try {
    const { rollNo, name, fatherName, classId, contact, gender, age } = req.body;

    // Check if class exists
    const classData = await ClassModel.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const newStudent = new StudentModel({
      rollNo,
      name,
      fatherName,
      class: classId,
      contact,
      gender,
      age,
    });

    await newStudent.save();

    // Add student to class
    await ClassModel.findByIdAndUpdate(classId, {
      $push: { students: newStudent._id },
    });

    res.status(201).json({
      message: "Student created successfully",
      student: newStudent,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await StudentModel.find().populate("class", "className");

    res.status(200).json({
      message: "Students fetched successfully",
      count: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student by ID
export const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await StudentModel.findById(studentId).populate(
      "class",
      "className"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const updates = req.body;

    const student = await StudentModel.findByIdAndUpdate(studentId, updates, {
      new: true,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      message: "Student updated successfully",
      student,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await StudentModel.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Remove from class
    await ClassModel.findByIdAndUpdate(student.class, {
      $pull: { students: studentId },
    });

    // Delete attendance records
    await AttendenceModel.deleteMany({ studentId });

    await StudentModel.findByIdAndDelete(studentId);

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk create students from Excel import
export const bulkCreateStudents = async (req, res) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "No student data provided" });
    }

    const success = [];
    const failed = [];

    for (const student of students) {
      try {
        const { rollNo, name, fatherName, contact, gender, age } = student;
        const studentClassId = student.classId;

        if (!rollNo || !name || !fatherName || !studentClassId || !gender) {
          const missing = [];
          if (!rollNo) missing.push("rollNo");
          if (!name) missing.push("name");
          if (!fatherName) missing.push("fatherName");
          if (!studentClassId) missing.push("classId");
          if (!gender) missing.push("gender");
          failed.push({ rollNo: rollNo || "?", reason: `Missing fields: ${missing.join(", ")}` });
          continue;
        }

        // Find class by ID
        const classData = await ClassModel.findById(studentClassId);
        if (!classData) {
          failed.push({ rollNo, reason: `Class not found` });
          continue;
        }

        // Check duplicate roll number
        const existing = await StudentModel.findOne({ rollNo: String(rollNo) });
        if (existing) {
          failed.push({ rollNo, reason: "Roll number already exists" });
          continue;
        }

        const newStudent = new StudentModel({
          rollNo: String(rollNo),
          name,
          fatherName,
          class: classData._id,
          contact: contact || undefined,
          gender: String(gender).toLowerCase(),
          age: age || undefined,
        });

        await newStudent.save();
        await ClassModel.findByIdAndUpdate(classData._id, {
          $push: { students: newStudent._id },
        });

        success.push(rollNo);
      } catch (err) {
        failed.push({ rollNo: student.rollNo || "?", reason: err.message });
      }
    }

    res.status(200).json({
      message: `Import complete. ${success.length} added, ${failed.length} failed.`,
      success,
      failed,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ TEACHER MANAGEMENT ============

// Get all teachers
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await UserModel.find({ role: "teacher" })
      .select("-password")
      .populate("assignedClasses", "className");

    res.status(200).json({
      message: "Teachers fetched successfully",
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update teacher
export const updateTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { name, email, contact, classId, gender } = req.body;

    const teacher = await UserModel.findByIdAndUpdate(
      teacherId,
      { name, email, contact, gender, classId },
      { new: true }
    ).select("-password");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json({
      message: "Teacher updated successfully",
      teacher,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete teacher
export const deleteTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await UserModel.findOne({ _id: teacherId, role: "teacher" });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Remove teacher from classes
    await ClassModel.updateMany(
      { classTeacher: teacherId },
      { $unset: { classTeacher: "" } }
    );

    await UserModel.findByIdAndDelete(teacherId);

    res.status(200).json({ message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ ATTENDANCE REPORTS ============

// Get attendance summary for all classes
export const getAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    const summary = await AttendenceModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { classId: "$classId", status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.classId",
          attendance: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
        },
      },
    ]);

    res.status(200).json({
      message: "Attendance summary fetched",
      summary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
