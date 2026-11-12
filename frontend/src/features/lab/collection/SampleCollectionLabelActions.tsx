/* eslint-disable no-restricted-syntax -- isolated print document HTML/CSS strings */
import type { Sample } from '@/types';
import { SAMPLE_TYPE_CONFIG, type SampleType } from '@/types/enums';
import { displayId } from '@/utils';
import { formatDateTime } from '@/utils/date';
import { feedbackTitle } from '@/feedback';

/** Small tube label — landscape strip (~36 × 18 mm). */
const LABEL_PAGE_WIDTH_IN = '1.42in';
const LABEL_PAGE_HEIGHT_IN = '0.71in';

export type SampleLabelPrintInput = {
  patientName: string;
  sample: Sample;
  /** Collection or label event time; defaults from sample when omitted. */
  eventAt?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function sampleTypeLabel(sampleType: string): string {
  const key = sampleType as SampleType;
  return SAMPLE_TYPE_CONFIG[key]?.label ?? sampleType;
}

function resolveLabelDateTime(sample: Sample, eventAt?: string | null): string {
  const raw =
    eventAt ??
    ((sample.status === 'collected' || sample.status === 'rejected') && 'collectedAt' in sample
      ? sample.collectedAt
      : undefined) ??
    sample.createdAt;
  return formatDateTime(raw) || new Date().toLocaleString();
}

function assertSampleLabelPrintable(
  sample: Sample | null | undefined
): asserts sample is Sample & { sampleId: number } {
  if (sample?.sampleId == null) {
    throw new Error(feedbackTitle('lab.collection.printLabel.uncollected'));
  }
}

const TUBE_LABEL_PRINT_CSS = `
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page {
    size: ${LABEL_PAGE_WIDTH_IN} ${LABEL_PAGE_HEIGHT_IN};
    margin: 0.025in;
  }
  @media print {
    html, body {
      width: ${LABEL_PAGE_WIDTH_IN};
      height: ${LABEL_PAGE_HEIGHT_IN};
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
  }
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #000000;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    display: flex;
    align-items: stretch;
    justify-content: center;
  }
  .label {
    width: 100%;
    height: 100%;
    max-width: 1.34in;
    color: #000000;
    display: flex;
    flex-direction: column;
    padding: 2pt 3pt 1pt;
    gap: 0;
  }
  .label-patient {
    margin: 0;
    padding: 0 0 2pt;
    border-bottom: 0.4pt solid #000000;
    font-size: 7pt;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: 0.01em;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .label-meta {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    column-gap: 4pt;
    row-gap: 0.5pt;
    padding: 2pt 0;
    border-bottom: 0.4pt solid #000000;
    align-items: baseline;
  }
  .label-id {
    grid-column: 1;
    grid-row: 1;
    font-size: 7pt;
    font-weight: 800;
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
    text-align: left;
  }
  .label-type {
    grid-column: 2;
    grid-row: 1;
    font-size: 5.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-align: right;
    white-space: nowrap;
  }
  .label-when {
    grid-column: 1 / -1;
    grid-row: 2;
    margin: 0;
    font-size: 5pt;
    font-weight: 500;
    line-height: 1.2;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .label-scan {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding-top: 1.5pt;
    min-height: 0;
  }
  .label-barcode {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    width: 100%;
    line-height: 0;
  }
  .label-barcode svg {
    display: block;
    width: 100%;
    max-width: 1.3in;
    height: auto;
  }
  .label-barcode-caption {
    margin: 0.5pt 0 0;
    font-size: 4.5pt;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-align: center;
    color: #000000;
  }
  @media screen {
    body {
      min-height: 140px;
      padding: 16px;
      align-items: center;
    }
    .label {
      max-width: 1.42in;
      min-height: 0.71in;
      border: 0.75pt dashed #000000;
      border-radius: 2pt;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }
  }
`;

/**
 * Generates compact all-black HTML for a small tube label.
 */
export const generatePrintLabelHTML = ({ patientName, sample, eventAt }: SampleLabelPrintInput): string => {
  assertSampleLabelPrintable(sample);

  const sampleIdDisplay = displayId.sample(sample.sampleId);
  const sampleType = sampleTypeLabel(sample.sampleType || 'other');
  const dateTime = resolveLabelDateTime(sample, eventAt);

  const safePatient = escapeHtml(patientName.trim() || 'Unknown');
  const safeType = escapeHtml(sampleType.toUpperCase());
  const safeDateTime = escapeHtml(dateTime);
  const safeSampleId = escapeHtml(sampleIdDisplay);
  const barcodeValue = escapeJsString(sampleIdDisplay);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Label - ${safeSampleId}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
        <style>${TUBE_LABEL_PRINT_CSS}</style>
      </head>
      <body>
        <article class="label">
          <header class="label-patient" title="${safePatient}">${safePatient}</header>

          <section class="label-meta" aria-label="Specimen details">
            <span class="label-id">${safeSampleId}</span>
            <span class="label-type">${safeType}</span>
            <p class="label-when">${safeDateTime}</p>
          </section>

          <footer class="label-scan">
            <div class="label-barcode">
              <svg id="barcode" role="img" aria-label="Barcode ${safeSampleId}"></svg>
            </div>
            <p class="label-barcode-caption">${safeSampleId}</p>
          </footer>
        </article>
        <script>
          (function() {
            try {
              JsBarcode("#barcode", "${barcodeValue}", {
                format: "CODE128",
                width: 0.9,
                height: 15,
                displayValue: false,
                margin: 0,
                lineColor: "#000000",
                background: "#ffffff"
              });
              window.onload = function() {
                setTimeout(function() { window.print(); }, 400);
              };
            } catch (e) {
              const el = document.getElementById('barcode');
              if (el) {
                el.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#000000" font-size="6">Barcode error</text>';
              }
            }
          })();
        </script>
      </body>
    </html>
  `;
};

/**
 * Opens a print window with the sample label.
 */
export const printCollectionLabel = (input: SampleLabelPrintInput): void => {
  try {
    const htmlContent = generatePrintLabelHTML(input);
    const printWindow = window.open('', '', 'width=260,height=130');

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
