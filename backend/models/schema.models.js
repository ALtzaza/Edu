import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

const { Schema } = mongoose;
// ⭐️ หมายเหตุ: AutoIncrement ยังคงต้อง import มาเพื่อใช้กับ model อื่น (ถ้ามี)
// แต่เราจะเอาออกจาก quizSchema
const AutoIncrement = mongooseSequence(mongoose);

// -------- USERS --------
const userSchema = new Schema({
  name: { type: String, required: true },
  surname: { type: String },
  username: { type: String, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  avatar: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/149/149071.png", // รูป default
  },
  bio: String,
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpire: Date,

});


// -------- COURSE CATEGORIES --------
const categorySchema = new Schema({
  name: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now }
});



const courseSchema = new Schema(
  {
    // เชื่อมโยงไปที่ Model 'Category'
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    title: { type: String, required: true },
    description: String,
    thumbnail: String,
    price: { type: Number, required: true, default: 0 }, // <-- ราคา อยู่ที่นี่ // เชื่อมโยงไปที่ Model 'User' (ที่เป็น Admin)
    instructor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    sections: [{ type: Schema.Types.ObjectId, ref: "Section" }],
  },
  {
    timestamps: true, // สร้าง createdAt, updatedAt อัตโนมัติ
  }
); // -------- 4. SECTION (Schema ใหม่ที่ต้องเพิ่ม) --------
// (ใช้สำหรับจัดกลุ่มบทเรียน เช่น "บทที่ 1", "บทที่ 2")
const sectionSchema = new Schema(
  {
    title: { type: String, required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
  },
  {
    timestamps: true,
  }
);

// -------- LESSONS --------
const lessonSchema = new Schema(
  {
    title: { type: String, required: true },
    content: String,
    videoUrl: String,
    attachments: [{ name: String, url: String }],
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    section: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    quizzes: [{ type: Schema.Types.ObjectId, ref: "Quiz" }],
    order: { type: Number, default: 0 },
        type: { 
        type: String, 
        enum: ["content", "quiz", "workshop"], 
        default: "content" 
    }, 
    lessonNumber: { type: Number, index: true },
  },
  { timestamps: true }
);

// -------- PURCHASES --------
const purchaseSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  amount: { 
    type: Number, 
    min: [0, "Amount ต้องเป็นบวกเสมอ"],
    required: true 
  },
  status: { type: String, enum: ['pending', 'paid', 'cancelled', 'refunded'], default: 'pending' },
  paymentMethod: { 
    type: String, 
    enum: ['credit_card', 'bank_transfer', 'wallet', 'mock', 'manual', 'gift', 'admin_granted'], 
    default: 'manual',
    required: true 
  },
  paymentRef: String,
  slipUrl: { type: String }, // แนบสลิป
  createdAt: { type: Date, default: Date.now },
  transactionId: { 
    type: String, 
    unique: true, 
    default: () => `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`
  },
  purchasedAt: { type: Date }
});



// -------- QUIZ --------
const quizSchema = new Schema({
  lesson: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
  quizNumber: { type: Number }, 
  question: String,
  choices: [String],
  correctAnswer: String,
});


// -------- QUIZ RESULTS --------
const quizResultSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  lesson: { type: Schema.Types.ObjectId, ref: "Lesson" },
  score: Number,
  total: Number,
  percentage: Number, // 🟢 เพิ่ม: เก็บเปอร์เซ็นต์ที่ทำได้
  passed: { type: Boolean, default: false }, // 🟢 เพิ่ม: ผ่านเกณฑ์หรือไม่
  submittedAt: { type: Date, default: Date.now },
});

// -------- WORKSHOPS --------
const workshopSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  course: { type: Schema.Types.ObjectId, ref: "Course" },
  lesson: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
  fileUrl: String,
  feedback: String,
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
});

// -------- CERTIFICATES --------
const certificateSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  course: { type: Schema.Types.ObjectId, ref: "Course" },
  issueDate: { type: Date, default: Date.now },
  certificateData: { type: String, required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
});

// -------- REVIEWS --------
const reviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ป้องกันการรีวิวซ้ำ (1 user ต่อ 1 course)
reviewSchema.index({ user: 1, course: 1 }, { unique: true });

// อัปเดตเวลาอัตโนมัติเมื่อแก้ไข
reviewSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


// -------- PROGRESS --------
const progressSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  lessonsCompleted: Number,
  totalLessons: Number,
  percentage: Number,
  lastWatched: { type: Schema.Types.ObjectId, ref: 'Lesson' },
  updatedAt: { type: Date, default: Date.now }
});

// -------- NOTIFICATIONS (อัปเกรด) --------
const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["system", "quiz", "workshop", "certificate", "purchase"],
      default: "system",
    },
    link: String, //  (เพิ่ม) URL ที่จะให้กดไป (เช่น /my-courses/course-id/workshops)
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true, //  (แก้) ใช้ timestamps
  }
);

// -------- BLOGS --------
const blogSchema = new Schema({
  title: String,
  content: String,
  author: { type: Schema.Types.ObjectId, ref: "User" },
  thumbnail: String,
  createdAt: { type: Date, default: Date.now },
});

// -------- EXPORT MODELS --------
export const User = mongoose.model("User", userSchema);
export const Category = mongoose.model("Category", categorySchema);
export const Course = mongoose.model("Course", courseSchema);
export const Purchase = mongoose.model("Purchase", purchaseSchema);
export const Quiz = mongoose.model("Quiz", quizSchema);
export const QuizResult = mongoose.model("QuizResult", quizResultSchema);
export const Workshop = mongoose.model("Workshop", workshopSchema);
export const Certificate = mongoose.model("Certificate", certificateSchema);
export const Review = mongoose.model("Review", reviewSchema);
export const Progress = mongoose.model("Progress", progressSchema);
export const Notification = mongoose.model("Notification", notificationSchema);
export const Blog = mongoose.model("Blog", blogSchema);
export const Lesson = mongoose.model("Lesson", lessonSchema);
export const Section = mongoose.model("Section", sectionSchema);
