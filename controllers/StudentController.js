import StudentModel from "../models/StudentSchema.js";
import ClassModel from "../models/ClassSchema.js";
import AttendenceModel from "../models/AttendenceSchema.js";

// Create a new student
export const createStudent = async (req, res) => {
  try {
    const { rollNo, name, fatherName, classId, contact, gender, age } = req.body;

    // Check if roll number already exists
    const existingStudent = await StudentModel.findOne({ rollNo });
    if (existingStudent) {
      return res.status(400).json({ message: "Roll number already exists" });
    }

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
    const { classId } = req.query;

    let query = {};
    if (classId) {
      query.class = classId;
    }

    const students = await StudentModel.find(query)
      .populate("class", "className")
      .sort({ rollNo: 1 });

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
      "className classTeacher"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student by roll number
export const getStudentByRollNo = async (req, res) => {
  try {
    const { rollNo } = req.params;

    const student = await StudentModel.findOne({ rollNo: parseInt(rollNo) }).populate(
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
    const { rollNo, name, fatherName, classId, contact, gender, age } = req.body;

    const student = await StudentModel.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // If roll number is being changed, check for duplicates
    if (rollNo && rollNo !== student.rollNo) {
      const existingStudent = await StudentModel.findOne({ rollNo });
      if (existingStudent) {
        return res.status(400).json({ message: "Roll number already exists" });
      }
      student.rollNo = rollNo;
    }

    // If class is being changed
    if (classId && classId !== student.class.toString()) {
      const newClass = await ClassModel.findById(classId);
      if (!newClass) {
        return res.status(404).json({ message: "New class not found" });
      }

      // Remove from old class
      await ClassModel.findByIdAndUpdate(student.class, {
        $pull: { students: studentId },
      });

      // Add to new class
      await ClassModel.findByIdAndUpdate(classId, {
        $push: { students: studentId },
      });

      student.class = classId;
    }

    // Update other fields
    if (name) student.name = name;
    if (fatherName) student.fatherName = fatherName;
    if (contact) student.contact = contact;
    if (gender) student.gender = gender;
    if (age) student.age = age;

    await student.save();

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

// Get student attendance history
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const student = await StudentModel.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let query = { studentId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await AttendenceModel.find(query)
      .populate("classId", "className")
      .populate("markedBy", "name")
      .sort({ date: -1 });

    // Calculate attendance stats
    const totalDays = attendance.length;
    const presentDays = attendance.filter((a) => a.status === "Present").length;
    const absentDays = attendance.filter((a) => a.status === "Absent").length;
    const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

    res.status(200).json({
      message: "Attendance fetched successfully",
      student: {
        _id: student._id,
        name: student.name,
        rollNo: student.rollNo,
      },
      stats: {
        totalDays,
        presentDays,
        absentDays,
        attendancePercentage: `${attendancePercentage}%`,
      },
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
