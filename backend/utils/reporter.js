/**
 * CSV and Report Generation Helpers
 * 
 * Compiles historical evaluation logs into tabular CSV format for recruiters
 * and structures report assets for printing.
 */

/**
 * Converte resume analysis records into structured CSV string format
 * @param {Array} records - List of resume evaluation objects
 */
function convertToCSV(records) {
  if (!records || records.length === 0) {
    return 'ID,Candidate Name,Email,Phone,ATS Score,Job Title,Skills Count,Created At\n';
  }

  const headers = ['ID', 'Candidate Name', 'Email', 'Phone', 'ATS Score', 'Job Title', 'Skills Count', 'Created At'];
  const rows = records.map(rec => {
    // Sanitize values to prevent CSV injection and handle commas
    const id = rec._id ? rec._id.toString() : '';
    const name = rec.extractedInfo?.name ? `"${rec.extractedInfo.name.replace(/"/g, '""')}"` : 'Unknown';
    const email = rec.extractedInfo?.email ? rec.extractedInfo.email : '';
    const phone = rec.extractedInfo?.phone ? `"${rec.extractedInfo.phone}"` : '';
    const score = rec.atsScore || 0;
    const title = rec.targetJobTitle ? `"${rec.targetJobTitle.replace(/"/g, '""')}"` : 'Software Engineer';
    const skillsCount = rec.extractedInfo?.skills ? rec.extractedInfo.skills.length : 0;
    const date = rec.createdAt ? new Date(rec.createdAt).toISOString() : '';

    return [id, name, email, phone, score, title, skillsCount, date].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

module.exports = {
  convertToCSV
};
