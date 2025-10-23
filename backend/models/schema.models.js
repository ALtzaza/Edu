import mongoose from 'mongoose';
const { Schema } = mongoose;

// -------- USERS --------
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: String,
  bio: String,
  createdAt: { type: Date, default: Date.now }
});


const categorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    description: String
  }, { 
    timestamps: true // สร้าง createdAt, updatedAt อัตโนมัติ
  });

  const courseSchema = new Schema({
    // เชื่อมโยงไปที่ Model 'Category'
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    
    title: { type: String, required: true },
    description: String,
    thumbnail: String,
    
    price: { type: Number, required: true, default: 0 }, // <-- ราคา อยู่ที่นี่
    
    // เชื่อมโยงไปที่ Model 'User' (ที่เป็น Admin)
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    sections: [{ type: Schema.Types.ObjectId, ref: 'Section' }]
  }, { 
    timestamps: true // สร้าง createdAt, updatedAt อัตโนมัติ
  });
  // -------- 4. SECTION (Schema ใหม่ที่ต้องเพิ่ม) --------
// (ใช้สำหรับจัดกลุ่มบทเรียน เช่น "บทที่ 1", "บทที่ 2")
const sectionSchema = new Schema({
    title: { type: String, required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],

  }, { 
    timestamps: true 
  });

  // -------- 5. LESSON (Schema ใหม่ที่ต้องเพิ่ม) --------
// (นี่คือเนื้อหาการเรียนจริง ที่ Quiz/Progress จะอ้างอิงถึง)
const lessonSchema = new Schema({
    title: { type: String, required: true },
    content: String, // เนื้อหาบทความ
    videoUrl: String, // ลิงก์วิดีโอ
    
    // (เชื่อมโยง)
    section: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    
    // (เชื่อมโยงไปหา Quiz ของคุณ)
    // 1 Lesson มีได้ 1 Quiz (หรือไม่มีก็ได้)
    quiz: { type: Schema.Types.ObjectId, ref: 'Quiz' } 
  
  }, { 
    timestamps: true 
  });

// -------- PURCHASES --------
const purchaseSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  amount: Number,
  status: { type: String, enum: ['pending', 'paid', 'cancelled', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['credit_card', 'bank_transfer', 'wallet', 'mock'], default: 'mock' },
  paymentRef: String,
  createdAt: { type: Date, default: Date.now }
});

// -------- QUIZ --------
const quizSchema = new Schema({
  lesson: { type: Schema.Types.ObjectId, ref: 'Lesson' },
  question: String,
  choices: [String],
  correctAnswer: String
});

// -------- QUIZ RESULTS --------
const quizResultSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  lesson: { type: Schema.Types.ObjectId, ref: 'Lesson' },
  score: Number,
  total: Number,
  submittedAt: { type: Date, default: Date.now }
});

// -------- WORKSHOPS --------
const workshopSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  fileUrl: String,
  feedback: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date
});

// -------- CERTIFICATES --------
const certificateSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  issueDate: { type: Date, default: Date.now },
  certificateUrl: String,
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

// -------- REVIEWS --------
const reviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

// -------- PROGRESS (แก้ไข Schema นี้) --------
const progressSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    
    // ⭐️ 1. (แก้ไข) เปลี่ยนเป็น Array เพื่อเก็บ ID ของบทเรียนที่จบแล้ว
    lessonsCompleted: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    
    totalLessons: { type: Number, default: 0 }, // ⭐️ 2. (เพิ่ม) เราจะเก็บจำนวนบทเรียนทั้งหมดของคอร์สไว้
    percentage: { type: Number, default: 0 },
    
    lastWatched: { type: Schema.Types.ObjectId, ref: 'Lesson' }
  }, { 
    timestamps: true // ⭐️ 3. (แก้ไข) ใช้ timestamps
  });
  
  // ⭐️ (สำคัญ) สร้าง Index เพื่อให้ User + Course ไม่ซ้ำกัน
  progressSchema.index({ user: 1, course: 1 }, { unique: true });

// -------- NOTIFICATIONS (อัปเกรด) --------
const notificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['system', 'quiz', 'workshop', 'certificate', 'purchase'], 
      default: 'system' 
    },
    link: String, // ⭐️ (เพิ่ม) URL ที่จะให้กดไป (เช่น /my-courses/course-id/workshops)
    isRead: { type: Boolean, default: false },
  }, { 
    timestamps: true // ⭐️ (แก้) ใช้ timestamps
  });

// -------- BLOGS --------
const blogSchema = new Schema({
  title: String,
  content: String,
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  thumbnail: String,
  createdAt: { type: Date, default: Date.now }
});

// -------- EXPORT MODELS --------
export const User = mongoose.model('User', userSchema);
export const Category = mongoose.model('Category', categorySchema);
export const Course = mongoose.model('Course', courseSchema);
export const Purchase = mongoose.model('Purchase', purchaseSchema);
export const Quiz = mongoose.model('Quiz', quizSchema);
export const QuizResult = mongoose.model('QuizResult', quizResultSchema);
export const Workshop = mongoose.model('Workshop', workshopSchema);
export const Certificate = mongoose.model('Certificate', certificateSchema);
export const Review = mongoose.model('Review', reviewSchema);
export const Progress = mongoose.model('Progress', progressSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const Blog = mongoose.model('Blog', blogSchema);
export const Lesson = mongoose.model('Lesson', lessonSchema);
export const Section = mongoose.model('Section', sectionSchema);