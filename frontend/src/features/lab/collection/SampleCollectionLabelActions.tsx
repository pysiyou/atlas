import type { SampleCollectionQueueItem } from '@/features/lab/types';
import { CONTAINER_COLOR_OPTIONS, isCollectedSample } from '@/types';
import { displayId } from '@/utils';
import { feedbackTitle } from '@/utils/feedback/copy';
import { TYPE } from '@/components/theme/recipes';


const PRINT_TOKEN_KEYS = [
  '--brand',
  '--text',
  '--text-tertiary',
  '--surface',
  '--surface-hover',
  '--border-strong',
  '--font-sans',
  '--id-font-weight',
] as const;

/**
 * Snapshot live theme tokens so the print window (Tailwind CDN, no app CSS) still matches.
 */
function snapshotPrintThemeCss(): string {
  if (typeof document === 'undefined') return '';
  const styles = getComputedStyle(document.documentElement);
  const decls = PRINT_TOKEN_KEYS.map(key => `${key}: ${styles.getPropertyValue(key).trim() || 'inherit'};`).join(
    '\n            ',
  );
  return `
            :root {
            ${decls}
            }
            .entity-id {
              font-family: var(--font-sans), sans-serif;
              font-size: 10px;
              font-weight: var(--id-font-weight);
              color: var(--brand);
              letter-spacing: 0.02em;
            }
            .entity-id--secondary {
              font-size: 10px;
              color: var(--text-tertiary);
            }
            .bg-surface { background-color: var(--surface); }
            .bg-surface-hover { background-color: var(--surface-hover); }
            .text-text-primary { color: var(--text); }
            .text-text-tertiary { color: var(--text-tertiary); }
            .border-border-strong { border-color: var(--border-strong); }
            .text-xxs { font-size: 10px; }
`;
}

/**
 * Generates HTML content for printing a sample label
 */
export const generatePrintLabelHTML = (display: SampleCollectionQueueItem, patientName: string): string => {
  const { sample, order } = display;

  if (!sample || !isCollectedSample(sample)) {
    throw new Error(feedbackTitle('lab.collection.printLabel.uncollected'));
  }

  const sampleId = sample.sampleId;
  const sampleIdDisplay = displayId.sample(sampleId);
  const patientIdDisplay = displayId.patient(order.patientId);
  const sampleType = sample.sampleType || 'unknown';
  const containerTopColor = sample.actualContainerColor;
  /**
   * Worklist payloads and older collected rows can omit actualContainerType.
   * Fall back by sample type so label HTML never calls toUpperCase on undefined.
   */
  const actualContainerType = sample.actualContainerType;
  const containerType =
    actualContainerType === 'cup' || actualContainerType === 'tube'
      ? actualContainerType
      : sampleType === 'urine' || sampleType === 'stool'
        ? 'cup'
        : 'tube';

  const colorName =
    CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerTopColor)?.label || 'N/A';

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString();
  const formattedTime = currentDate.toLocaleTimeString();
  const themeCss = snapshotPrintThemeCss();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Label - ${sampleIdDisplay}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
        <style>
          ${themeCss}
          @media print {
            @page {
              size: 4in 2in;
              margin: 0.125in;
            }
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .label-wrapper {
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .no-print {
              display: none;
            }
          }
          @media screen {
            body {
              padding: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
          }
        </style>
      </head>
      <body class="bg-surface m-0 p-0">
        <div class="label-wrapper">
          <div class="w-full max-w-[3.75in] flex flex-col items-center justify-center gap-1.5 p-2 border border-dashed border-border-strong print:border-none print:max-w-full print:p-0">
            <!-- Patient Name -->
            <div class="text-sm font-normal text-center text-text-primary leading-snug w-full">
              ${patientName}
            </div>

            <!-- Patient ID and Sample Type -->
            <div class="text-xxs text-center leading-tight">
              <span class="entity-id entity-id--secondary">${patientIdDisplay}</span>
              <span class="text-text-tertiary"> | ${sampleType.toUpperCase()}</span>
            </div>

            <!-- Container Info -->
            <div class="w-full text-xxs font-normal text-center text-text-primary bg-surface-hover rounded px-2 py-1 print:py-0.5">
              ${containerType.toUpperCase()}: ${colorName.toUpperCase()}
            </div>

            <!-- Barcode -->
            <div class="flex justify-center items-center w-full py-0.5">
              <svg id="barcode" class="max-w-full h-auto"></svg>
            </div>

            <!-- Sample ID -->
            <div class="text-center leading-tight">
              <span class="entity-id">${sampleIdDisplay}</span>
            </div>

            <!-- Date and Time -->
            <div class="${TYPE.caption} text-center leading-tight">
              ${formattedDate} ${formattedTime}
            </div>
          </div>
        </div>

        <script>
          (function() {
            try {
              JsBarcode("#barcode", "${sampleIdDisplay}", {
                format: "CODE128",
                width: 1.2,
                height: 35,
                displayValue: false,
                margin: 2
              });

              // Auto-print after barcode is rendered
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            } catch (e) {
              // Fallback: fixed string only (no user input). innerHTML is safe; do not substitute user content here.
              const el = document.getElementById('barcode');
              if (el) el.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="red" font-size="10">Barcode Error</text>';
            }
          })();
        </script>
      </body>
    </html>
  `;
};

/**
 * Opens a print window with the sample label
 * Note: patientName should be looked up before calling this function
 */
export const printCollectionLabel = (display: SampleCollectionQueueItem, patientName: string): void => {
  try {
    const htmlContent = generatePrintLabelHTML(display, patientName);
    const printWindow = window.open('', '', 'width=400,height=250');

    if (!printWindow) {
      throw new Error(feedbackTitle('lab.collection.printLabel.popupBlocked'));
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(feedbackTitle('lab.collection.printLabel.genericError'));
  }
};
