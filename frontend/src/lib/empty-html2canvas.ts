/**
 * Stub for jspdf's optional html2canvas dependency.
 * Atlas draws vector PDFs only and never calls `doc.html()`.
 */
export function html2canvas(): Promise<never> {
  return Promise.reject(new Error('html2canvas is not bundled in this app'));
}

export default html2canvas;
