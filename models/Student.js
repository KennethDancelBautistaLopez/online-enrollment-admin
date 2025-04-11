import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema(
  {
    _studentId: { type: String, unique: true, required: true },
    fname: { type: String, required: true },
    mname: { type: String },
    lname: { type: String, required: true },
    address: { type: String, required: true },
    mobile: { type: String, required: true },
    landline: { type: String },
    facebook: { type: String },
    birthdate: { type: Date, required: true },
    birthplace: { type: String, required: true },
    nationality: { type: String, required: true },
    religion: { type: String },
    sex: { type: String, enum: ["Male", "Female", "Other"], required: true },
    father: { type: String },
    mother: { type: String },
    guardian: { type: String },
    guardianOccupation: { type: String },
    registrationDate: { type: Date, default: Date.now },
    lrn: { type: String, unique: true },

    semester: { type: String },
    nursery: {
      schoolName: { type: String },
      yearAttended: { type: String },
    },
    elementary: {
      schoolName: { type: String },
      yearAttended: { type: String },
    },
    juniorHigh: {
      schoolName: { type: String },
      yearAttended: { type: String },
    },
    seniorHigh: {
      schoolName: { type: String },
      yearAttended: { type: String },
    },
    
    education: { type: String },
    course: { type: String },
    yearLevel: { type: String, required: true },
    schoolYear: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    status: {
      type: String,
      enum: ["enrolled", "graduated", "dropped", "missing files"],
      default: "missing files"
    },

    files: [{
      filename: { type: String, required: true },
      filePath: { type: String, required: true },
      mimeType: { type: String, required: true },
      size: { type: Number, required: true }
    }],

    // 💵 New Fields for Payment Tracking
    tuitionFee: { type: Number, default: 0 }, // Set this per student
    totalPaid: { type: Number, default: 0 },  // Sum of completed payments
    balance: { type: Number, default: 0 },    // tuitionFee - totalPaid

    // 🔗 Reference to related payments (optional, for fast lookup)
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }]
  },
  { timestamps: true }
);

export default mongoose.models.Student || mongoose.model("Student", StudentSchema);
