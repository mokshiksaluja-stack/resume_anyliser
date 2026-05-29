/**
 * Resume NLP Parser Utility
 * 
 * Decodes raw text from uploaded resumes (PDF, TXT, DOCX) and uses 
 * vocabulary-driven NLP and regular expressions to extract candidate data,
 * contact details, and technical skills.
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Exhaustive Technology and Skill Dictionary organized by Domains
const SKILLS_DICTIONARY = {
  Languages: [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 
    'ruby', 'php', 'swift', 'kotlin', 'scala', 'perl', 'r', 'html', 'css', 'sql', 'bash'
  ],
  Frontend: [
    'react', 'angular', 'vue', 'next.js', 'nuxt', 'svelte', 'tailwind', 'bootstrap', 
    'redux', 'webpack', 'sass', 'jquery', 'flexbox', 'grid', 'material ui', 'semantic ui'
  ],
  Backend: [
    'node.js', 'node', 'express', 'django', 'flask', 'fastapi', 'spring boot', 'spring', 
    'asp.net', 'laravel', 'ruby on rails', 'rails', 'graphql', 'rest api', 'soap', 'nest.js'
  ],
  Database: [
    'mongodb', 'postgresql', 'postgres', 'mysql', 'redis', 'sqlite', 'oracle', 'firebase', 
    'mariadb', 'cassandra', 'dynamodb', 'neo4j', 'sequelize', 'mongoose'
  ],
  DevOps_Cloud: [
    'docker', 'kubernetes', 'aws', 'amazon web services', 'gcp', 'google cloud', 'azure', 
    'jenkins', 'ci/cd', 'git', 'github', 'gitlab', 'terraform', 'ansible', 'linux', 'nginx', 'apache'
  ],
  AI_DataScience: [
    'machine learning', 'deep learning', 'nlp', 'spacy', 'nltk', 'tensorflow', 'pytorch', 
    'scikit-learn', 'pandas', 'numpy', 'keras', 'opencv', 'tableau', 'powerbi', 'data science'
  ],
  Management_SoftSkills: [
    'communication', 'leadership', 'teamwork', 'problem solving', 'agile', 'scrum', 
    'project management', 'critical thinking', 'time management', 'collaboration', 'negotiation'
  ]
};

// Extracts plain text from DOCX (Word) documents by scanning XML tags
function parseDocxText(buffer) {
  try {
    const bodyStr = buffer.toString('utf8');
    // Simple extraction of text inside paragraph/text tags (<w:t>)
    const textMatches = bodyStr.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (textMatches) {
      return textMatches
        .map(val => val.replace(/<[^>]+>/g, ''))
        .join(' ');
    }
    // Fallback: strip standard printable ASCII boundaries from docx binary stream
    return bodyStr.replace(/[^ -~\n\r\t]/g, ' ');
  } catch (err) {
    console.error('[PARSER] DOCX decode error, executing binary fallback:', err.message);
    return buffer.toString('ascii').replace(/[^ -~\n\r\t]/g, ' ');
  }
}

/**
 * Extracts and categorizes contact details, education, work experience, and tech skills
 * @param {string} text - Raw decoded text of the resume
 */
function processExtractedText(text) {
  const normalizedText = text.toLowerCase();
  
  // 1. Extract Email Address
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0].trim() : '';

  // 2. Extract Phone Number
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phoneMatch = text.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  // 3. Extract Candidate Name
  // Algorithm: Read first 5 lines. Filter out lines with emails, phone numbers, urls, or too short.
  // Take the first matching line as the Name candidate.
  let candidateName = 'Unknown Candidate';
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    const isContact = emailRegex.test(line) || phoneRegex.test(line) || line.includes('http') || line.includes('www');
    const isHeader = line.toLowerCase().includes('resume') || line.toLowerCase().includes('cv') || line.toLowerCase().includes('curriculum');
    
    if (!isContact && !isHeader && line.split(/\s+/).length >= 2 && line.split(/\s+/).length <= 4) {
      candidateName = line;
      break;
    }
  }

  // 4. Extract Skills using Dictionary Mapping
  const matchedSkills = [];
  Object.keys(SKILLS_DICTIONARY).forEach(category => {
    SKILLS_DICTIONARY[category].forEach(skill => {
      // Use boundary detection to match full words like 'node' or 'r' instead of letters in other words
      const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      let skillRegex;
      
      // Node.js specific match
      if (skill === 'node' || skill === 'node.js') {
        skillRegex = /\bnode(?:\.js)?\b/gi;
      } else if (skill.length <= 2) {
        // Shorter terms like Go, C, R require strict word boundaries
        skillRegex = new RegExp(`\\b${escapedSkill}\\b`, 'gi');
      } else {
        skillRegex = new RegExp(`\\b${escapedSkill}\\b|${escapedSkill}`, 'gi');
      }

      if (skillRegex.test(normalizedText)) {
        // Standardize naming
        let displayName = skill.split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        
        // Manual capitalization overrides
        if (displayName.toLowerCase() === 'javascript') displayName = 'JavaScript';
        if (displayName.toLowerCase() === 'typescript') displayName = 'TypeScript';
        if (displayName.toLowerCase() === 'html') displayName = 'HTML';
        if (displayName.toLowerCase() === 'css') displayName = 'CSS';
        if (displayName.toLowerCase() === 'mysql') displayName = 'MySQL';
        if (displayName.toLowerCase() === 'mongodb') displayName = 'MongoDB';
        if (displayName.toLowerCase() === 'postgresql') displayName = 'PostgreSQL';
        if (displayName.toLowerCase() === 'ci/cd') displayName = 'CI/CD';
        if (displayName.toLowerCase() === 'aws') displayName = 'AWS';
        if (displayName.toLowerCase() === 'gcp') displayName = 'GCP';
        if (displayName.toLowerCase() === 'nlp') displayName = 'NLP';
        if (displayName.toLowerCase() === 'api') displayName = 'API';
        if (displayName.toLowerCase() === 'spacy') displayName = 'spaCy';
        if (displayName.toLowerCase() === 'nltk') displayName = 'NLTK';

        if (!matchedSkills.includes(displayName)) {
          matchedSkills.push(displayName);
        }
      }
    });
  });

  // 5. Section-based Segment Extraction (Education and Experience)
  const educationSegments = [];
  const experienceSegments = [];
  
  // Section headers markers
  const eduKeywords = ['education', 'academic', 'college', 'university', 'degree', 'qualification'];
  const expKeywords = ['experience', 'employment', 'work history', 'internship', 'job', 'professional'];

  let activeSection = null;

  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    
    // Check if this line is a section header
    const isEduHeader = eduKeywords.some(keyword => lowerLine.includes(keyword)) && line.length < 35;
    const isExpHeader = expKeywords.some(keyword => lowerLine.includes(keyword)) && line.length < 35;
    
    if (isEduHeader) {
      activeSection = 'education';
      return;
    } else if (isExpHeader) {
      activeSection = 'experience';
      return;
    } else if (line.length < 30 && (lowerLine.includes('skills') || lowerLine.includes('projects') || lowerLine.includes('interests') || lowerLine.includes('hobbies') || lowerLine.includes('certification'))) {
      activeSection = null; // Exit collection of education/experience
    }

    if (activeSection === 'education' && line.length > 5) {
      if (educationSegments.length < 10) educationSegments.push(line);
    } else if (activeSection === 'experience' && line.length > 5) {
      if (experienceSegments.length < 15) experienceSegments.push(line);
    }
  });

  // Graceful defaults if no sections were parsed
  if (educationSegments.length === 0) {
    educationSegments.push('Review resume file details for academic qualifications.');
  }
  if (experienceSegments.length === 0) {
    experienceSegments.push('Review resume file details for work history.');
  }

  return {
    name: candidateName,
    email: email,
    phone: phone,
    skills: matchedSkills,
    education: educationSegments,
    experience: experienceSegments,
    rawText: text
  };
}

/**
 * Main parser controller entry point
 * @param {string} filePath - Absolute path to the file
 * @param {string} originalName - Original filename with extension
 */
async function parseResumeFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  let rawText = '';

  try {
    if (ext === '.txt') {
      rawText = fs.readFileSync(filePath, 'utf8');
    } else if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const parsedPdf = await pdfParse(dataBuffer);
      rawText = parsedPdf.text;
    } else if (ext === '.docx') {
      const dataBuffer = fs.readFileSync(filePath);
      rawText = parseDocxText(dataBuffer);
    } else {
      throw new Error('Unsupported extension format');
    }
    
    if (!rawText || rawText.trim().length === 0) {
      throw new Error('File contained no readable text characters.');
    }

    return processExtractedText(rawText);
  } catch (err) {
    console.error(`[NLP PARSER] Parser error on file ${originalName}:`, err.message);
    throw err;
  }
}

module.exports = {
  parseResumeFile,
  SKILLS_DICTIONARY
};
