/**
 * Upload Dashboard Controller
 * 
 * Manages drag & drop file upload fields, form submissions, 
 * historical evaluations tables, and export triggers.
 */

window.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const fileStatus = document.getElementById('file-status');
  const fileNameDisplay = document.getElementById('file-name-display');
  const clearFileBtn = document.getElementById('clear-file-btn');
  const analyzeForm = document.getElementById('analyze-form');
  const submitBtn = document.getElementById('submit-analysis-btn');
  const historyRowsContainer = document.getElementById('history-rows-container');
  const exportCsvBtn = document.getElementById('export-csv-btn');

  let selectedFile = null;

  // 1. DRAG AND DROP HANDLERS
  if (dropzone && fileInput) {
    // Open explorer on click
    dropzone.addEventListener('click', () => fileInput.click());

    // Highlight on drag events
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      }, false);
    });

    // Handle dropped files
    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        handleFileSelection(files[0]);
      }
    });

    // Handle standard file selection
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
      }
    });
  }

  // Handle selected file states
  function handleFileSelection(file) {
    const allowedExtensions = ['.pdf', '.txt', '.docx'];
    const fileName = file.name;
    const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      window.api.showToast('Invalid File: Only PDF, TXT, and DOCX resumes are supported.', 'error');
      return;
    }

    // Size limit check: 5MB
    if (file.size > 5 * 1024 * 1024) {
      window.api.showToast('File too large: Max resume size allowed is 5MB.', 'error');
      return;
    }

    selectedFile = file;
    fileNameDisplay.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    fileStatus.classList.add('active');
  }

  // Clear selected file
  if (clearFileBtn) {
    clearFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedFile = null;
      fileInput.value = '';
      fileStatus.classList.remove('active');
    });
  }

  // 2. FORM SUBMIT HANDLER (API Uploads)
  if (analyzeForm) {
    analyzeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!selectedFile) {
        window.api.showToast('Please upload or drag a resume file first.', 'error');
        return;
      }

      const jobTitle = document.getElementById('target-title').value;
      const jobDescription = document.getElementById('job-desc').value;

      // Construct Multi-part FormData
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('jobTitle', jobTitle);
      formData.append('jobDescription', jobDescription);

      // Visual loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Parsing Content & Analyzing ATS Score...';

      try {
        const data = await window.api.resume.analyze(formData);
        window.api.showToast('Analysis completed successfully!', 'success');
        
        // Reset inputs
        selectedFile = null;
        fileInput.value = '';
        fileStatus.classList.remove('active');
        analyzeForm.reset();

        // Refresh History list and route to Report Page
        loadHistory();
        window.location.hash = `#report/${data.report._id}`;
      } catch (err) {
        window.api.showToast(err.message || 'Analysis processing failed.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Start AI Extraction';
      }
    });
  }

  // 3. EXPORT CSV CLICK HANDLER
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      window.location.href = window.api.resume.getExportCSVUrl();
    });
  }

  // 4. LOAD HISTORY DATA FOR DASHBOARD TABLE
  async function loadHistory() {
    if (!historyRowsContainer) return;
    
    // Set loading indicator
    historyRowsContainer.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">
          Retrieving historical records...
        </td>
      </tr>
    `;

    try {
      const data = await window.api.resume.getHistory();
      
      if (!data.history || data.history.length === 0) {
        historyRowsContainer.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">
              No resume evaluations completed yet. Upload a resume above to start!
            </td>
          </tr>
        `;
        return;
      }

      historyRowsContainer.innerHTML = '';
      
      data.history.forEach(item => {
        const row = document.createElement('tr');
        
        // Truncate long file names
        const cleanName = item.fileName.length > 25 
          ? item.fileName.substring(0, 22) + '...' 
          : item.fileName;
        
        const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        // Determine score classes
        let scoreClass = 'color-danger';
        if (item.atsScore >= 80) scoreClass = 'color-success';
        else if (item.atsScore >= 60) scoreClass = 'color-warning';

        row.innerHTML = `
          <td>
            <div style="font-weight:600; color:var(--text-primary);">${cleanName}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${dateStr}</div>
          </td>
          <td>${item.targetJobTitle}</td>
          <td>
            <span style="font-weight:800;" class="${scoreClass}">${item.atsScore}%</span>
          </td>
          <td>
            <div class="row-actions">
              <button class="btn btn-secondary view-report-btn" data-id="${item._id}" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">View</button>
              <button class="btn btn-danger delete-report-btn" data-id="${item._id}" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; background:none;">Delete</button>
            </div>
          </td>
        `;

        historyRowsContainer.appendChild(row);
      });

      // Bind button click triggers
      document.querySelectorAll('.view-report-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const reportId = e.target.getAttribute('data-id');
          window.location.hash = `#report/${reportId}`;
        });
      });

      document.querySelectorAll('.delete-report-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const reportId = e.target.getAttribute('data-id');
          if (confirm('Are you sure you want to permanently delete this resume analysis record from your history?')) {
            try {
              const res = await window.api.resume.delete(reportId);
              window.api.showToast(res.message, 'success');
              loadHistory();
            } catch (err) {
              window.api.showToast(err.message || 'Deletion failed.', 'error');
            }
          }
        });
      });

    } catch (err) {
      historyRowsContainer.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--color-danger); padding: 3rem 0;">
            Failed to retrieve historical items: ${err.message}
          </td>
        </tr>
      `;
    }
  }

  // Subscribe to Dashboard view load notifications
  window.addEventListener('view-dashboard', () => {
    loadHistory();
  });
});
