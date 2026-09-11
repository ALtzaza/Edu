# 🎓 Tid_Code - Educational Platform

A comprehensive full-stack educational platform built with **React + Vite** (frontend) and **Node.js + Express** (backend). This system manages courses, lessons, quizzes, workshops, and student purchases with admin capabilities.

## 👥 Contributors

This project was developed by **3 team members**:
- Developer 1 
- Developer 2
- Developer 3

---

## 🚀 Tech Stack

### Frontend
- **Framework**: React 19.1 + Vite
- **Styling**: Bootstrap 5.3, CSS Modules
- **Routing**: React Router v7.9
- **HTTP Client**: Axios
- **Animations**: Framer Motion
- **Icons**: React Bootstrap Icons
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js with ES6 Modules
- **Framework**: Express 5.1
- **Database**: MongoDB + Mongoose 8.19
- **Authentication**: JWT + bcryptjs
- **File Upload**: Multer
- **Cloud Storage**: AWS S3
- **PDF Generation**: Puppeteer
- **CORS**: Enabled for cross-origin requests

---

## ✨ Features

### Student Features
- ✅ User registration & login with JWT authentication
- ✅ Browse courses by categories
- ✅ Enroll in courses
- ✅ Watch lessons with progress tracking
- ✅ Take quizzes and view results
- ✅ Download certificates upon completion
- ✅ Participate in workshops
- ✅ Review courses and instructors
- ✅ Payment processing with bank slip generation
- ✅ Reset password functionality

### Admin Features
- ✅ Dashboard with analytics
- ✅ Manage courses, categories, and sections
- ✅ Manage lesson content
- ✅ Create & manage quizzes
- ✅ Approve/reject workshops
- ✅ View user purchases & statistics
- ✅ Manage user accounts
- ✅ Review management system

---

## 📁 Project Structure

```
Edu/
├── frontend/                    # React + Vite application
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── layouts/           # Layout templates
│   │   ├── context/           # React Context (Auth, etc)
│   │   ├── services/          # API integration services
│   │   ├── api/               # API configuration
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── package.json
│
├── backend/                     # Node.js + Express API
│   ├── routes/                # API route handlers
│   │   ├── courses.js
│   │   ├── lessons.js
│   │   ├── quizzes.js
│   │   ├── workshops.js
│   │   ├── users.js
│   │   ├── purchases.js
│   │   ├── admin.js
│   │   └── ...
│   ├── models/                # MongoDB schemas
│   ├── controllers/           # Business logic
│   ├── middleware/            # Custom middleware
│   │   ├── authMiddleware.js  # JWT verification
│   │   ├── roleMiddleware.js  # Role-based access
│   │   └── mockAuth.js
│   ├── config/                # Configuration files
│   │   ├── db.js              # Database connection
│   │   └── cors.js            # CORS settings
│   ├── utils/                 # Helper utilities
│   │   ├── pdfGenerator.js    # PDF generation
│   │   └── htmlTemplate.js    # Email templates
│   ├── uploads/               # File uploads directory
│   │   ├── thumbnails/
│   │   └── slips/
│   ├── server.js              # Express app entry point
│   ├── .env                   # Environment variables
│   └── package.json
│
└── README.md                   # This file
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- AWS S3 account (optional, for file uploads)

### Step 1: Clone & Navigate
```bash
cd Edu
```

### Step 2: Backend Setup
```bash
cd backend
npm install
```

Create or verify `.env` file:
```env
PORT=3000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here
BANK_NAME=SCB
BANK_ACCOUNT_NUMBER=123-4-56789-0
BANK_ACCOUNT_NAME=Company Name
PROMPTPAY_QR_URL=https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=FAKEPAYMENT
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 🏃 Running the Project

### Start Backend (Terminal 1)
```bash
cd backend
npm start
# Server runs at http://localhost:3000
```

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
# App opens at http://localhost:5173
```

### Build for Production
```bash
# Frontend
cd frontend
npm run build    # Creates dist/ folder

# Backend
# Just deploy server.js with node
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/reset-password` - Reset password

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (admin)

### Lessons
- `GET /api/lessons` - Get lessons
- `GET /api/lessons/:id` - Get lesson details
- `POST /api/lessons` - Create lesson (admin)

### Quizzes
- `GET /api/quizzes` - Get quizzes
- `POST /api/lessons/:lessonId/quizzes/take` - Take quiz
- `POST /api/quizresults` - Submit quiz results

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - Manage users
- `GET /api/admin/purchases` - Manage purchases

---

## 🔐 Authentication

The project uses **JWT (JSON Web Tokens)** for authentication:
1. User logs in → receives JWT token
2. Token stored in localStorage
3. Token sent in `Authorization` header for protected routes
4. `authMiddleware.js` verifies token validity

### Role-Based Access Control
- **User**: Regular student access
- **Admin**: Full access to management features

---

## 📦 Database Models

- **User**: Student/Admin accounts
- **Category**: Course categories
- **Course**: Course information
- **Section**: Course sections
- **Lesson**: Individual lessons
- **Quiz**: Quiz questions
- **QuizResult**: Student quiz submissions
- **Certificate**: Certificates earned
- **Workshop**: Workshop information
- **Review**: Course reviews
- **Purchase**: Payment/enrollment records
- **Progress**: Student progress tracking

---

## 🛠️ Development

### Available Scripts

**Frontend**:
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

**Backend**:
```bash
npm start         # Start server
npm run dev       # Start with nodemon (auto-reload)
```

### Environment Variables

**Backend** (.env):
- `PORT` - Server port (default: 3000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `BANK_*` - Payment information

---

## 📝 Notes

- Frontend proxy configured to `http://localhost:3000` for API calls
- CORS enabled for local development
- File uploads stored in `/backend/uploads/`
- PDF generation using Puppeteer
- AWS S3 integration available for cloud storage

---

## 🤝 Contributing

To contribute to this project:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Create a pull request

---

## 📄 License

This project is licensed under the ISC License.

---

## 📞 Support

For issues or questions, please contact the development team or create an issue in the repository.

---

**Last Updated**: September 2026  
**Status**: In Development ✅
