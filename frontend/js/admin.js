/**
 * Recruitment Operations Controller
 * 
 * Aggregates platform telemetry datasets, compiling
 * Chart.js score distributions, category breakdowns,
 * and binding activity listings.
 */

window.addEventListener('DOMContentLoaded', () => {
  const statUsers = document.getElementById('admin-stat-users');
  const statResumes = document.getElementById('admin-stat-resumes');
  const statScore = document.getElementById('admin-stat-score');
  const activityContainer = document.getElementById('admin-activity-container');

  // Chart References
  let distributionChart = null;
  let categoriesChart = null;

  /**
   * Initializes and populates the dashboard graphs and tables
   */
  async function loadAdminAnalytics() {
    try {
      const data = await window.api.admin.getAnalytics();
      const stats = data.analytics;

      // 1. Populates text metrics
      if (statUsers) statUsers.textContent = stats.totalUsers || 0;
      if (statResumes) statResumes.textContent = stats.totalResumes || 0;
      if (statScore) statScore.textContent = `${stats.averageScore || 0}%`;

      // 2. Build Score Distribution Bar Chart
      buildDistributionChart(stats.distribution);

      // 3. Build Job Categories Doughnut Chart
      buildCategoriesChart(stats.categories);

      // 4. Populates Recent Activity table
      populateActivityList(stats.recentActivity);

    } catch (err) {
      window.api.showToast(`Failed to load recruitment metrics: ${err.message}`, 'error');
      window.location.hash = '#dashboard';
    }
  }

  /**
   * Renders the rating range distribution chart
   */
  function buildDistributionChart(distData) {
    const ctx = document.getElementById('chart-distribution').getContext('2d');
    if (!ctx) return;

    const values = [
      distData.poor || 0,
      distData.average || 0,
      distData.good || 0,
      distData.excellent || 0
    ];

    // Destroys past instance if reload triggered to prevent context ghost overlapping
    if (distributionChart) {
      distributionChart.destroy();
    }

    const isDark = !document.body.classList.contains('light-theme');
    const labelColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)';

    distributionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Critical (<50)', 'Developing (50-70)', 'ATS Optimized (70-85)', 'Highly Elite (85+)'],
        datasets: [{
          label: 'Scans',
          data: values,
          backgroundColor: [
            'rgba(239, 68, 68, 0.6)',   // Crimson
            'rgba(245, 158, 11, 0.6)',  // Amber
            'rgba(99, 102, 241, 0.6)',  // Indigo
            'rgba(16, 185, 129, 0.6)'   // Emerald
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(245, 158, 11)',
            'rgb(99, 102, 241)',
            'rgb(16, 185, 129)'
          ],
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: labelColor }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: labelColor, stepSize: 1 },
            beginAtZero: true
          }
        }
      }
    });
  }

  /**
   * Renders the role categories doughnut chart
   */
  function buildCategoriesChart(categoriesData) {
    const ctx = document.getElementById('chart-categories').getContext('2d');
    if (!ctx) return;

    if (categoriesChart) {
      categoriesChart.destroy();
    }

    const labels = categoriesData.map(c => c.name);
    const values = categoriesData.map(c => c.count);

    // Fallback labels if empty database
    const finalLabels = labels.length > 0 ? labels : ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'DevOps', 'Data Science'];
    const finalValues = values.length > 0 ? values : [0, 0, 0, 0, 0];

    const isDark = !document.body.classList.contains('light-theme');
    const labelColor = isDark ? '#94a3b8' : '#475569';

    categoriesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: finalLabels,
        datasets: [{
          data: finalValues,
          backgroundColor: [
            'rgba(99, 102, 241, 0.6)',  // Indigo
            'rgba(6, 182, 212, 0.6)',   // Cyan
            'rgba(16, 185, 129, 0.6)',  // Emerald
            'rgba(139, 92, 246, 0.6)',  // Violet
            'rgba(244, 63, 94, 0.6)'    // Rose
          ],
          borderColor: isDark ? '#0f172a' : '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: labelColor }
          }
        },
        cutout: '70%'
      }
    });
  }

  /**
   * Populates recent platform activities table
   */
  function populateActivityList(activityList) {
    if (!activityContainer) return;

    if (!activityList || activityList.length === 0) {
      activityContainer.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 2.5rem 0; color:var(--text-muted);">
            No resume evaluations registered on the platform.
          </td>
        </tr>
      `;
      return;
    }

    activityContainer.innerHTML = '';
    
    activityList.forEach(act => {
      const tr = document.createElement('tr');

      const dateStr = new Date(act.createdAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let scoreClass = 'color-danger';
      if (act.atsScore >= 80) scoreClass = 'color-success';
      else if (act.atsScore >= 60) scoreClass = 'color-warning';

      tr.innerHTML = `
        <td><strong style="color:var(--text-primary);">${act.candidateName}</strong></td>
        <td><span style="font-size:0.85rem; color:var(--text-muted);">${act.fileName}</span></td>
        <td>${act.targetJobTitle}</td>
        <td><span class="${scoreClass}" style="font-weight:800;">${act.atsScore}%</span></td>
        <td>${dateStr}</td>
      `;

      activityContainer.appendChild(tr);
    });
  }

  // Reload charts labels on global theme toggles
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    // Wait for theme switch class lists to end
    setTimeout(() => {
      if (window.appRouter.currentView === 'admin') {
        loadAdminAnalytics();
      }
    }, 150);
  });

  // Subscribe to Admin page hash calls
  window.addEventListener('view-admin', () => {
    loadAdminAnalytics();
  });
});
