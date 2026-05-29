# Apex Resume AI - Technical API Specification

All API endpoints are prefixed with `/api` and return standard JSON formats. Private endpoints require authorization via JSON Web Tokens (JWT) passed inside the HTTP header.

---

## 🔒 Security Headers
For private endpoints, include the JWT token as a Bearer string:
```http
Authorization: Bearer <your_jwt_token_here>
```

---

## 📂 1. Authentication Router (`/api/auth`)

### 1.1 Register User
- **Endpoint**: `/api/auth/register`
- **Method**: `POST`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Alex Smith",
  "email": "alex@domain.com",
  "password": "mySecurePassword",
  "role": "user" 
}
```
*(Note: `role` can be `user` or `admin`)*
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Account registered successfully!",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "648a12bc8f4d92...",
    "name": "Alex Smith",
    "email": "alex@domain.com",
    "role": "user"
  }
}
```

### 1.2 Authenticate Login
- **Endpoint**: `/api/auth/login`
- **Method**: `POST`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "alex@domain.com",
  "password": "mySecurePassword"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful, welcome back!",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "648a12bc8f4d92...",
    "name": "Alex Smith",
    "email": "alex@domain.com",
    "role": "user"
  }
}
```

### 1.3 Active User Status
- **Endpoint**: `/api/auth/me`
- **Method**: `GET`
- **Access**: Private (Requires token)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "648a12bc8f4d92...",
    "name": "Alex Smith",
    "email": "alex@domain.com",
    "role": "user",
    "createdAt": "2026-05-29T07:10:30.000Z"
  }
}
```

---

## 📄 2. Resume Router (`/api/resume`)

### 2.1 Analyze Resume Document
- **Endpoint**: `/api/resume/analyze`
- **Method**: `POST`
- **Access**: Private (Requires token)
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `resume` (Binary - PDF, DOCX, or TXT file, max 5MB)
  - `jobTitle` (String, Optional) - Target role (default: "General Software Engineer")
  - `jobDescription` (String, Optional) - Target role details for keyword overlay.
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Resume analyzed successfully!",
  "report": {
    "_id": "report98765xyz",
    "userId": "648a12bc8f4d92...",
    "fileName": "alex_resume.pdf",
    "fileSize": 184520,
    "targetJobTitle": "Frontend Developer",
    "targetJobDescription": "Looking for React, TypeScript, HTML and CSS experience...",
    "atsScore": 84,
    "metrics": {
      "keywordMatchScore": 75,
      "structuralScore": 90,
      "skillsScore": 80,
      "educationScore": 90,
      "experienceScore": 85
    },
    "extractedInfo": {
      "name": "Alex Smith",
      "email": "alex@domain.com",
      "phone": "+1-555-0199",
      "skills": ["JavaScript", "TypeScript", "React", "HTML", "CSS", "Git", "Node.js"],
      "education": ["Bachelor of Science in Computer Science - Tech University"],
      "experience": ["Junior Engineer at CodeCorp - 2 Years"]
    },
    "matchedSkills": ["JavaScript", "TypeScript", "React", "HTML", "CSS"],
    "missingSkills": ["REST API"],
    "suggestions": [
      "Your resume meets all critical ATS formatting standards.",
      "Consider acquiring or highlighting missing industry-critical skills: REST API."
    ],
    "interviewQuestions": [
      {
        "question": "Your profile highlights experience with React...",
        "answerGuideline": "Answer using the STAR method..."
      }
    ],
    "createdAt": "2026-05-29T12:40:00.000Z"
  }
}
```

### 2.2 Retrieve Scans History
- **Endpoint**: `/api/resume/history`
- **Method**: `GET`
- **Access**: Private (Requires token)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "history": [
    {
      "_id": "report98765xyz",
      "fileName": "alex_resume.pdf",
      "atsScore": 84,
      "targetJobTitle": "Frontend Developer",
      "createdAt": "2026-05-29T12:40:00.000Z"
    }
  ]
}
```

### 2.3 Retrieve Specific Report Detail
- **Endpoint**: `/api/resume/report/:id`
- **Method**: `GET`
- **Access**: Private (Requires token)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "report": {
    "_id": "report98765xyz",
    "fileName": "alex_resume.pdf",
    "atsScore": 84,
    "targetJobTitle": "Frontend Developer",
    "metrics": { ... },
    "extractedInfo": { ... },
    "matchedSkills": [...],
    "missingSkills": [...],
    "suggestions": [...],
    "interviewQuestions": [...]
  }
}
```

### 2.4 Delete Report Log
- **Endpoint**: `/api/resume/:id`
- **Method**: `DELETE`
- **Access**: Private (Requires token)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Evaluation report deleted successfully!"
}
```

### 2.5 Export Historical Data CSV
- **Endpoint**: `/api/resume/export/csv`
- **Method**: `GET`
- **Access**: Private (Requires token)
- **HTTP Header Return**: `Content-Type: text/csv`
- **Body Return**: Raw multi-line comma-separated text table.

---

## 📈 3. System Admin Router (`/api/admin`)

### 3.1 Platform Telemetry Analytics
- **Endpoint**: `/api/admin/analytics`
- **Method**: `GET`
- **Access**: Private/Admin Only (Requires admin token)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "analytics": {
    "totalUsers": 12,
    "totalResumes": 42,
    "averageScore": 74,
    "distribution": {
      "poor": 3,
      "average": 11,
      "good": 22,
      "excellent": 6
    },
    "categories": [
      { "name": "Frontend Developer", "count": 15 },
      { "name": "Software Engineer", "count": 12 },
      { "name": "Backend Developer", "count": 9 },
      { "name": "DevOps Engineer", "count": 4 },
      { "name": "Data Scientist", "count": 2 }
    ],
    "recentActivity": [
      {
        "_id": "report98765xyz",
        "fileName": "alex_resume.pdf",
        "candidateName": "Alex Smith",
        "atsScore": 84,
        "targetJobTitle": "Frontend Developer",
        "createdAt": "2026-05-29T12:40:00.000Z"
      }
    ]
  }
}
```
