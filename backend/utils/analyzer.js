/**
 * ATS Analytics and Scoring Engine
 * 
 * Performs semantic comparison between extracted resume metrics and target Job Descriptions,
 * calculates specific sub-scores, isolates missing terminology, and compiles custom
 * interview prep questions.
 */

const { SKILLS_DICTIONARY } = require('./parser');

/**
 * Extracts key software terms from a raw Job Description text
 * @param {string} jdText - Job description text
 */
function extractJdKeywords(jdText) {
  if (!jdText) return [];
  const normalizedJd = jdText.toLowerCase();
  const foundKeywords = [];

  // Iterate dictionary and collect matches
  Object.keys(SKILLS_DICTIONARY).forEach(category => {
    SKILLS_DICTIONARY[category].forEach(skill => {
      const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      let skillRegex;
      if (skill.length <= 2) {
        skillRegex = new RegExp(`\\b${escapedSkill}\\b`, 'gi');
      } else {
        skillRegex = new RegExp(`\\b${escapedSkill}\\b|${escapedSkill}`, 'gi');
      }

      if (skillRegex.test(normalizedJd)) {
        // Capitalize standardly
        const displayName = skill.split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        
        if (!foundKeywords.includes(displayName)) {
          foundKeywords.push(displayName);
        }
      }
    });
  });

  return foundKeywords;
}

/**
 * Executes a comprehensive analysis of the resume details against a job description
 * @param {object} parsedResume - Output from parser.js
 * @param {string} jdText - Raw Job Description
 * @param {string} jdTitle - Target job role title
 */
function analyzeResume(parsedResume, jdText = '', jdTitle = 'Software Engineer') {
  const resumeSkills = parsedResume.skills || [];
  const targetKeywords = extractJdKeywords(jdText);
  
  // Set default core skills if no target JD is supplied (standard Software Engineer profile)
  const finalJdKeywords = targetKeywords.length > 0 
    ? targetKeywords 
    : ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'REST API', 'Agile'];

  // 1. Keyword Matching Metrics
  const matchedSkills = resumeSkills.filter(skill => 
    finalJdKeywords.some(jdSkill => jdSkill.toLowerCase() === skill.toLowerCase())
  );
  
  const missingSkills = finalJdKeywords.filter(jdSkill => 
    !resumeSkills.some(skill => skill.toLowerCase() === jdSkill.toLowerCase())
  );

  // Sub-scores
  // Keyword Score: ratio of matches (max 100)
  const keywordMatchScore = finalJdKeywords.length > 0
    ? Math.round((matchedSkills.length / finalJdKeywords.length) * 100)
    : 80;

  // Skills Score: total number of skills recognized (cap at 15 for max points)
  const skillsScore = Math.min(Math.round((resumeSkills.length / 15) * 100), 100);

  // Structural Score check
  let structuralScore = 40; // baseline
  const suggestions = [];

  if (parsedResume.email) {
    structuralScore += 15;
  } else {
    suggestions.push('Add an email address to the contact section so recruiters can easily reach you.');
  }

  if (parsedResume.phone) {
    structuralScore += 15;
  } else {
    suggestions.push('Add a phone number or mobile contact header to your resume.');
  }

  // Check section layouts
  const rawTextLower = parsedResume.rawText ? parsedResume.rawText.toLowerCase() : '';
  
  const hasEducation = rawTextLower.includes('education') || rawTextLower.includes('academic') || rawTextLower.includes('university') || rawTextLower.includes('college');
  const hasExperience = rawTextLower.includes('experience') || rawTextLower.includes('work') || rawTextLower.includes('employment') || rawTextLower.includes('intern');
  const hasProjects = rawTextLower.includes('project') || rawTextLower.includes('accomplishment') || rawTextLower.includes('portfolio');

  if (hasEducation) {
    structuralScore += 10;
  } else {
    suggestions.push('Clearly isolate an "Education" or "Academic Qualifications" section header.');
  }

  if (hasExperience) {
    structuralScore += 10;
  } else {
    suggestions.push('Create a dedicated "Work Experience" or "Professional History" block to showcase your practical projects.');
  }

  if (hasProjects) {
    structuralScore += 10;
  } else {
    suggestions.push('Add a "Projects" section detailing personal or academic applications built.');
  }

  structuralScore = Math.min(structuralScore, 100);

  // Experience weight (based on lines and keywords found in work sections)
  let experienceScore = Math.min(
    Math.round(((parsedResume.experience ? parsedResume.experience.length : 0) / 8) * 100),
    100
  );
  if (experienceScore < 40) experienceScore = 40; // baseline

  // Education weight (based on length of qualifications segment)
  let educationScore = Math.min(
    Math.round(((parsedResume.education ? parsedResume.education.length : 0) / 4) * 100),
    100
  );
  if (educationScore < 45) educationScore = 45; // baseline

  // Calculate Overall ATS compatibility score (weighted formula)
  // 35% Keyword match, 25% Skills breadth, 20% Structural score, 20% experience layout
  const rawAts = (keywordMatchScore * 0.35) + (skillsScore * 0.25) + (structuralScore * 0.20) + (experienceScore * 0.20);
  const atsScore = Math.max(10, Math.min(100, Math.round(rawAts)));

  // Generate generic suggestions if resume is highly optimized already
  if (suggestions.length === 0) {
    suggestions.push('Your resume meets all critical ATS formatting standards. Consider adding quantifiable project metrics (e.g., "improved load time by 30%").');
  }

  // Append customized skill improvement suggestions
  if (missingSkills.length > 0) {
    suggestions.push(`Consider acquiring or highlighting missing industry-critical skills: ${missingSkills.slice(0, 3).join(', ')}.`);
  }

  // 6. Generate Custom Interview Prep Questions
  const interviewQuestions = generateInterviewPrep(matchedSkills, missingSkills, jdTitle);

  return {
    atsScore,
    metrics: {
      keywordMatchScore,
      structuralScore,
      skillsScore,
      educationScore,
      experienceScore
    },
    matchedSkills,
    missingSkills,
    suggestions,
    interviewQuestions
  };
}

/**
 * Generates custom interview questions based on matched and missing keywords
 * @param {Array} matched - Extracted matching keywords
 * @param {Array} missing - Extracted missing keywords
 * @param {string} role - Target job title
 */
function generateInterviewPrep(matched, missing, role) {
  const prep = [];
  
  // Question 1: Focused on matched key technical strengths
  if (matched.length > 0) {
    const mainSkill = matched[0];
    prep.push({
      question: `Your profile highlights experience with ${mainSkill}. Can you describe a complex production issue or project challenge you solved using ${mainSkill}, and how you structured the implementation?`,
      answerGuideline: `Answer using the STAR method (Situation, Task, Action, Result). Highlight your deep understanding of ${mainSkill}'s design patterns, optimization techniques, and the tangible positive metrics (e.g., performance gains, scalability) achieved.`
    });
  } else {
    prep.push({
      question: `As a candidate interviewing for a ${role} position, how do you approach learning a completely new technical stack or toolchain under tight project deadlines?`,
      answerGuideline: `Focus on your systematic engineering mindset: reading documentation, building proof-of-concept sandboxes, leveraging online developer communities, and collaborating with senior peers for code reviews.`
    });
  }

  // Question 2: Focused on bridging a missing skill gap
  if (missing.length > 0) {
    const gapSkill = missing[0];
    prep.push({
      question: `While reviewing requirements for this role, we noticed a preference for ${gapSkill}. Although your resume emphasizes other skills, do you have familiarity with ${gapSkill}, or how would you map your current skill set to deliver results using it?`,
      answerGuideline: `Acknowledge the gap honestly, but bridge it immediately to a related concept you DO know (e.g., if missing PostgreSQL, relate it to MySQL or MongoDB queries). Mention any self-study or online tutorials you are currently pursuing to master ${gapSkill}.`
    });
  } else {
    prep.push({
      question: `This role requires high-volume collaboration. Can you give an example of a time you worked on a cross-functional team and how you handled conflicting architectural opinions?`,
      answerGuideline: `Highlight active listening, focus on data-driven benchmarks (e.g., speed, memory consumption), compromise for the sake of the project delivery, and adherence to scrum/agile team alignments.`
    });
  }

  // Question 3: Deep architecture role specific question
  prep.push({
    question: `In a modern ${role} landscape, applications must scale seamlessly. How do you integrate security, testing, and CI/CD pipelines into your daily software development lifecycle?`,
    answerGuideline: `Discuss writing unit tests (e.g., Jest, PyTest), doing static code analysis (ESLint), isolating environments with Docker, secure secrets management (not committing keys to git), and utilizing automated CI/CD runs (GitHub Actions) to run tests before staging deployments.`
  });

  return prep;
}

module.exports = {
  analyzeResume
};
