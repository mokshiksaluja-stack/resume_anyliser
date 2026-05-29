/**
 * Analysis Report Controller
 * 
 * Fetches and structures parsed analytics into circular gauges, 
 * skills matrix badges, formatting suggestions lists, 
 * accordion components, and triggers standard print outputs.
 */

window.addEventListener('DOMContentLoaded', () => {
  const printBtn = document.getElementById('report-print-btn');
  const backBtn = document.getElementById('report-back-btn');
  
  const candidateName = document.getElementById('report-candidate-name');
  const metaInfo = document.getElementById('report-meta-info');
  const scoreText = document.getElementById('report-score-text');
  const scoreRing = document.getElementById('report-score-ring');
  const scoreBadge = document.getElementById('report-score-badge');

  // Sub-scores
  const keywordText = document.getElementById('metric-keyword-text');
  const keywordBar = document.getElementById('metric-keyword-bar');
  const skillsText = document.getElementById('metric-skills-text');
  const skillsBar = document.getElementById('metric-skills-bar');
  const structuralText = document.getElementById('metric-structural-text');
  const structuralBar = document.getElementById('metric-structural-bar');

  // Lists Containers
  const matchedSkillsContainer = document.getElementById('matched-skills-container');
  const missingSkillsContainer = document.getElementById('missing-skills-container');
  const suggestionsContainer = document.getElementById('suggestions-container');
  const interviewQuestionsContainer = document.getElementById('interview-questions-container');
  const segmentExperienceContainer = document.getElementById('segment-experience-container');
  const segmentEducationContainer = document.getElementById('segment-education-container');

  // Tab switcher
  const tabButtons = document.querySelectorAll('.report-tab-btn');
  const detailPanes = document.querySelectorAll('.detail-pane');

  // 1. REPORT NAVIGATION HANDLERS
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = '#dashboard';
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // 2. DETAILED SHEETS TAB TOGGLES
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      detailPanes.forEach(pane => pane.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(targetTab);
      if (pane) pane.classList.add('active');
    });
  });

  /**
   * Fetches detailed record from API and populates Report UI
   * @param {string} reportId - ID of the evaluation report
   */
  async function loadReportDetails(reportId) {
    try {
      const data = await window.api.resume.getReport(reportId);
      const report = data.report;

      // Populate header details
      candidateName.textContent = report.extractedInfo?.name || 'Candidate Evaluation';
      metaInfo.textContent = `File: ${report.fileName} • Target: ${report.targetJobTitle} • Date: ${new Date(report.createdAt).toLocaleDateString()}`;

      // Update Circular gauge scores and trigger dash offset transitions
      // Dasharray bounds is 565 units length
      const score = report.atsScore || 0;
      scoreText.innerHTML = `${score}<span class="gauge-percent">%</span>`;
      
      const offset = 565 - (565 * score) / 100;
      scoreRing.style.strokeDashoffset = offset;

      // Select score badge text & styling class
      scoreBadge.className = 'score-badge'; // reset
      if (score >= 80) {
        scoreBadge.textContent = 'Highly Compatible';
        scoreBadge.style.background = 'var(--color-success-glow)';
        scoreBadge.style.color = 'var(--color-success)';
      } else if (score >= 60) {
        scoreBadge.textContent = 'Partially Compatible';
        scoreBadge.style.background = 'var(--color-warning-glow)';
        scoreBadge.style.color = 'var(--color-warning)';
      } else {
        scoreBadge.textContent = 'Incompatible Profile';
        scoreBadge.style.background = 'var(--color-danger-glow)';
        scoreBadge.style.color = 'var(--color-danger)';
      }

      // Update Sub-scores and progress metrics bars
      const metrics = report.metrics || {};
      keywordText.textContent = `${metrics.keywordMatchScore || 0}%`;
      keywordBar.style.width = `${metrics.keywordMatchScore || 0}%`;
      
      skillsText.textContent = `${metrics.skillsScore || 0}%`;
      skillsBar.style.width = `${metrics.skillsScore || 0}%`;

      structuralText.textContent = `${metrics.structuralScore || 0}%`;
      structuralBar.style.width = `${metrics.structuralScore || 0}%`;

      // Populate Matched Skills Tags
      matchedSkillsContainer.innerHTML = '';
      if (report.matchedSkills && report.matchedSkills.length > 0) {
        report.matchedSkills.forEach(skill => {
          const tag = document.createElement('span');
          tag.className = 'skill-tag match';
          tag.innerHTML = `
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
            ${skill}
          `;
          matchedSkillsContainer.appendChild(tag);
        });
      } else {
        matchedSkillsContainer.innerHTML = '<span style="color:var(--text-muted); font-size:0.9rem;">No matching skills detected.</span>';
      }

      // Populate Missing Skills Tags
      missingSkillsContainer.innerHTML = '';
      if (report.missingSkills && report.missingSkills.length > 0) {
        report.missingSkills.forEach(skill => {
          const tag = document.createElement('span');
          tag.className = 'skill-tag missing';
          tag.innerHTML = `
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
            ${skill}
          `;
          missingSkillsContainer.appendChild(tag);
        });
      } else {
        missingSkillsContainer.innerHTML = '<span style="color:var(--color-success); font-size:0.9rem; font-weight:600;">Excellent: No major skill gaps detected!</span>';
      }

      // Populate ATS suggestions list
      suggestionsContainer.innerHTML = '';
      if (report.suggestions && report.suggestions.length > 0) {
        report.suggestions.forEach(suggestion => {
          const li = document.createElement('li');
          li.textContent = suggestion;
          suggestionsContainer.appendChild(li);
        });
      } else {
        suggestionsContainer.innerHTML = '<li>Your resume layout is fully optimized for Applicant Tracking Systems!</li>';
      }

      // Populate Customized Mock Interview Questions
      interviewQuestionsContainer.innerHTML = '';
      if (report.interviewQuestions && report.interviewQuestions.length > 0) {
        report.interviewQuestions.forEach((q, index) => {
          const item = document.createElement('div');
          item.className = 'question-item';
          item.innerHTML = `
            <h4>Question ${index + 1}: ${q.question}</h4>
            <p><strong>Expert Answer Guideline:</strong> ${q.answerGuideline}</p>
          `;
          interviewQuestionsContainer.appendChild(item);
        });
      } else {
        interviewQuestionsContainer.innerHTML = '<p style="color:var(--text-muted);">No interview preps populated.</p>';
      }

      // Populate parsed raw text segments (Experience & Education)
      if (segmentExperienceContainer) {
        segmentExperienceContainer.innerHTML = '';
        if (report.extractedInfo?.experience && report.extractedInfo.experience.length > 0) {
          report.extractedInfo.experience.forEach(line => {
            const div = document.createElement('div');
            div.style.marginBottom = '0.5rem';
            div.textContent = line;
            segmentExperienceContainer.appendChild(div);
          });
        } else {
          segmentExperienceContainer.textContent = 'No structured experience sections parsed.';
        }
      }

      if (segmentEducationContainer) {
        segmentEducationContainer.innerHTML = '';
        if (report.extractedInfo?.education && report.extractedInfo.education.length > 0) {
          report.extractedInfo.education.forEach(line => {
            const div = document.createElement('div');
            div.style.marginBottom = '0.5rem';
            div.textContent = line;
            segmentEducationContainer.appendChild(div);
          });
        } else {
          segmentEducationContainer.textContent = 'No structured education sections parsed.';
        }
      }

    } catch (err) {
      window.api.showToast(`Failed to load analysis report details: ${err.message}`, 'error');
      window.location.hash = '#dashboard';
    }
  }

  // Bind view-report load routing notifications from router.js
  window.addEventListener('view-report', (e) => {
    const params = e.detail.params;
    if (params && params.length > 0) {
      const reportId = params[0];
      loadReportDetails(reportId);
    } else {
      window.api.showToast('Invalid report reference.', 'error');
      window.location.hash = '#dashboard';
    }
  });
});
