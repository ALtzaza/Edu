import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';

const { Schema } = mongoose;
const AutoIncrement = mongooseSequence(mongoose);

// -------- USERS --------
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
//   avatar: String,
//   bio: String,
//   createdAt: { type: Date, default: Date.now }
});

// -------- COURSE CATEGORIES --------
const categorySchema = new Schema({
  name: { type: String, required: true },
  description: String
});

// -------- COURSES --------
const courseSchema = new Schema({
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  title: { type: String, required: true },
  description: String,
  thumbnail: String,
  price: { type: Number, required: true },
  instructor: String,
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
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
  lessonNum: Number,  
  quizNumber: { type: Number, unique: true },
  question: String,
  choices: [String],
  correctAnswer: String
});

quizSchema.plugin(AutoIncrement, { inc_field: 'quizNumber' });  



// -------- QUIZ RESULTS --------
const quizResultSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  lesson: { type: Schema.Types.ObjectId, ref: 'Lesson' },
  lessonNum: Number,
  score: Number,
  total: Number,
  submittedAt: { type: Date, default: Date.now }
});

// -------- LESSONS -------- (เพิ่มส่วนนี้เข้าไป)
const lessonSchema = new Schema({
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  title: { type: String, required: true },
  lessonNumber: { type: Number, unique: true },
  // คุณอาจจะเพิ่ม field อื่นๆ เช่น videoUrl, content ฯลฯ
  createdAt: { type: Date, default: Date.now }
});

lessonSchema.plugin(AutoIncrement, { inc_field: 'lessonNumber' });


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
  certificateData: { type: String, required: true },
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

// -------- NOTIFICATIONS --------
const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  title: String,
  message: String,
  type: { type: String, enum: ['system', 'quiz', 'workshop', 'certificate'], default: 'system' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
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