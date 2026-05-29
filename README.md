# Apex Resume AI - Advanced Resume Analyzer

An industry-level, AI-powered Applicant Tracking System (ATS) optimization and resume parsing web application. Designed for students, freshers, job seekers, and recruiters, this application extracts candidate details, scores resumes against job descriptions, identifies missing skills, and compiles targeted mock interview preparation questions.

This project is fully self-contained and pre-configured for final-year college major project submissions, resume portfolios, and recruiter showcase evaluations.

---

## 🌟 Key Features

### 1. Document Decoding & Extraction
- **Text Parsers**: Pure-JS document decoder extracting structured text from **PDF, DOCX, and TXT** resume files.
- **NLP Regex Scanners**: Automatic scanning of contact details (emails, phone numbers) and candidates' names using multi-step heuristic boundary checks.
- **Section Isolation**: Context-based segment scanner isolating Experience paragraphs and Academic credentials.

### 2. High-Precision ATS Scoring & Keyword Analytics
- **Dictionary Skills Classifier**: Case-insensitive technology scanner mapping raw text against a deep, built-in library of **50+ software technologies** (categorized into Languages, Frontend, Backend, Database, Cloud/DevOps, AI/Data Science, and Soft Skills).
- **JD Overlap Scorer**: Computes the exact keyword overlap percentage between the resume's tech stack and target Job Descriptions.
- **ATS Rating Formula**: Custom multi-weighted compatibility algorithm checking keywords overlap (35%), skills breadth (25%), structural checkmarks (20%), and experience details (20%).
- **Format Recommendations**: Actionable tips to restructure formatting blocks (warning on missing contact info, missing section titles, or short experience logs) to bypass automated scanner blocks.

### 3. Customized Interview Prep Simulator
- **Dynamic Questions Generator**: Instantly generates custom technical screening questions based on matched resume strengths.
- **Gap Bridging Q&A**: Formulates custom tactical mock questions targeting the exact missing technology keywords detected, providing expert answer guidelines (STAR framework) to help candidates pass HR loops.

### 4. Recruiter Operations Control Panel
- **Telemetry Charts**: Beautiful interactive analytics boards driven by **Chart.js** displaying ATS scores distribution bars and targeted career disciplines doughnuts.
- **CSV Data Exporter**: Tabular exporter parsing historical scanning logs into a neat downloadable CSV file for recruiters.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Modern CSS3 (featuring HSL fluid colors, Glassmorphism panels, glowing dark default and toggled light themes, responsive grids, keyframes animations), Vanilla ES6+ JS, [Chart.js](https://www.chartjs.org/) library.
- **Backend**: Node.js + Express.js APIs, Multer multipart file upload engine, PDF-Parse text decoders, JSONWebToken auth modules, BcryptJS password encryption.
- **Database**: Mongoose MongoDB **OR** the automatic **Offline JSON File Database Fallback** (requires zero configuration, boots out-of-the-box on any local environment).

---

## 🚀 Step-by-Step Execution Guide

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v16.x or newer) installed.

### 2. Directory Alignment
Open your terminal and navigate to the project root directory:
```bash
cd /Users/kamalsaluja/.gemini/antigravity-ide/scratch/resume-analyzer
```
*(Tip: Set this folder as your Active Workspace in your IDE!)*

### 3. Installation
Install all dependencies using a single command at the root folder:
```bash
npm install
```

### 4. Configuration
Create a `.env` file in the root folder based on our template:
```bash
cp .env.example .env
```
Open `.env` in your text editor. If you want to use the **Offline JSON Database** mode (highly recommended for local demonstrations with zero setup), simply comment out or delete the `MONGODB_URI` line:
```env
PORT=5000
JWT_SECRET=super_secure_resume_analyzer_key_987654321_abc_xyz
NODE_ENV=development
# MONGODB_URI=mongodb://localhost:27017/resume-analyzer
```

### 5. Launch the Application
Start the server:
```bash
npm start
```

You will see the following output in the terminal:
```text
======================================================
[DATABASE] Running in OFFLINE JSON Database Mode.
[DATABASE] Data will be stored locally in: 
  /Users/kamalsaluja/.../backend/data/db_fallback.json
======================================================

======================================================
[SERVER] AI Resume Analyzer booted successfully.
[SERVER] Local URL: http://localhost:5000
======================================================
```

Open **[http://localhost:5000](http://localhost:5000)** in your web browser to explore the fully functional application!

---

## 💡 Common Errors and Fixes

### 1. "MongoDB Connection Failed" Warning
* **Cause**: Your `MONGODB_URI` variable is active in the `.env` file, but your local MongoDB service is stopped.
* **Fix**: The backend **automatically recovers** by falling back to Offline JSON DB mode! You do not need to do anything; the app remains fully interactive! Alternatively, start your local MongoDB service or comment out `MONGODB_URI` in `.env`.

### 2. "Invalid File Type" Rejection
* **Cause**: You attempted to upload a file with an unsupported extension.
* **Fix**: The system restricts uploads to **PDF (.pdf), Microsoft Word (.docx), and Plain Text (.txt)** formats for security and accurate parsing. Convert your resume to PDF or TXT and retry.

### 3. "File exceeds size limit of 5MB" Error
* **Cause**: Uploaded document size is too large.
* **Fix**: Compres your PDF or remove large embedded images from your Word file. Most standard resumes are under 500KB.

---

## 🎓 Technical Interview Q&A (Academic Project Defense)

When presenting this project for college defenses or technical job interviews, prepare for these key questions:

### Q1: How does your resume parsing NLP algorithm work?
> **Answer**: The parser employs a vocabulary-driven and heuristic rule-based NLP framework. Text extraction is handled in pure JavaScript using `pdf-parse` for PDF files and tag isolation for DOCX documents. Once raw text is extracted, the engine scans the text case-insensitively using word boundary anchors (`\b`) to match keywords against a predefined, categorized tech stack dictionary. Contact details (email, phone) are isolated using optimized regular expressions, while name extraction and sections isolation utilize position heuristics and context markers (e.g. tracking headings like 'Education' and 'Experience').

### Q2: Why did you implement a database fallback mechanism, and how does it function?
> **Answer**: In academic presentations or production demonstrations, database connectivity is a common point of failure. To guarantee resilience and 100% uptime, I built a unified query adapter. When MONGODB_URI is not active or fails to connect, the server automatically boots in 'Offline Mode', routing all operations to a local file system storage database (`db_fallback.json`). The query controller exposes methods like `.find()` and `.create()` which mimic standard Mongoose API responses, ensuring the route controllers function identically in both modes with zero code modifications!

### Q3: How is the ATS Score calculated?
> **Answer**: The ATS compatibility index uses a weighted multi-metric score calculation:
> 1. **Keyword Overlap (35% weight)**: Measures the Jaccard similarity index of tech skills matching the target Job Description.
> 2. **Skills Breadth (25% weight)**: Checks tech stack diversity across languages, frontend, backend, devops, database, etc.
> 3. **Structural Layout (20% weight)**: Evaluates layout standards (verifying presence of contact details, section divisions).
> 4. **Experience Depth (20% weight)**: Analyzes content density in work history sections.
