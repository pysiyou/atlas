/**
 * Printable bench worksheet — same window.print pattern as tube labels.
 */
import { worklistsAPI } from '../api/worklists';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Fetch entry-stage worksheet rows and open a printable HTML document.
 */
export async function printBenchWorksheet(params?: {
  testCode?: string;
  category?: string;
  priority?: string;
  priorityGroup?: string;
}): Promise<void> {
  const payload = await worklistsAPI.getWorksheet(params);
  const sections = payload.groups
    .map(group => {
      const rows = group.rows
        .map(row => {
          const accession = row.sampleId?.trim();
          if (!accession) return '';
          return `<tr>
              <td>${escapeHtml(row.patientName)}</td>
              <td>${escapeHtml(accession)}</td>
              <td>${escapeHtml(row.sampleType)}</td>
              <td>${escapeHtml(row.priority)}</td>
            </tr>`;
        })
        .join('');
      return `<h2>${escapeHtml(group.testName)} (${escapeHtml(group.testCode)})</h2>
        <table>
          <thead><tr><th>Patient</th><th>Accession</th><th>Sample</th><th>Priority</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    })
    .join('');

  // Print-only HTML (not app UI): hex colors are intentional for paper output.
  const html = `<!DOCTYPE html>
    <html><head><title>Bench worksheet</title>
    <style>
      body { font-family: Helvetica, Arial, sans-serif; padding: 16px; color: rgb(17 17 17); }
      h1 { font-size: 18px; }
      h2 { font-size: 14px; margin-top: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid rgb(203 213 225); padding: 6px 8px; text-align: left; }
      th { background: rgb(15 23 42); color: rgb(255 255 255); }
    </style></head>
    <body>
      <h1>Bench worksheet</h1>
      ${sections || '<p>No entry-stage tests match the current filters.</p>'}
      <script>window.onload = function() { window.print(); }</script>
    </body></html>`;

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!popup) return;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}
