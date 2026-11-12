/* eslint-disable no-restricted-syntax -- isolated print document HTML/CSS strings */
import type { Sample } from '@/types';
import { SAMPLE_TYPE_CONFIG, type SampleType } from '@/types/enums';
import { displayId } from '@/utils';
import { formatDateTime } from '@/utils/date';
import { feedbackTitle } from '@/feedback';

/** Narrow tube label (≈35 × 16 mm). */
const LABEL_PAGE_WIDTH_IN = '1.38in';
const LABEL_PAGE_HEIGHT_IN = '0.63in';

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
    margin: 0.03in;
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
    padding: 0.02in 0.04in;
    background: #ffffff;
    color: #000000;
    font-family: Arial, Helvetica, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .label {
    width: 100%;
    max-width: 1.28in;
    color: #000000;
    text-align: center;
    line-height: 1.1;
  }
  .label-name {
    font-size: 6.5pt;
    font-weight: 700;
    color: #000000;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    margin: 0 0 0.5pt;
  }
  .label-row {
    font-size: 5pt;
    font-weight: 600;
    color: #000000;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .label-id {
    font-size: 6pt;
    font-weight: 700;
    color: #000000;
    letter-spacing: 0.03em;
    margin: 0.5pt 0;
  }
  .label-barcode {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin: 0;
    line-height: 0;
  }
  .label-barcode svg {
    display: block;
    max-width: 100%;
    height: auto;
    color: #000000;
  }
  @media screen {
    body {
      min-height: 120px;
      padding: 12px;
    }
    .label {
      border: 1px dashed #000000;
      padding: 4px;
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
  const safeType = escapeHtml(sampleType);
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
        <div class="label">
          <div class="label-name" title="${safePatient}">${safePatient}</div>
          <div class="label-row">${safeType} · ${safeDateTime}</div>
          <div class="label-id">${safeSampleId}</div>
          <div class="label-barcode">
            <svg id="barcode" aria-label="Sample barcode"></svg>
          </div>
        </div>
        <script>
          (function() {
            try {
              JsBarcode("#barcode", "${barcodeValue}", {
                format: "CODE128",
                width: 0.75,
                height: 14,
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
    const printWindow = window.open('', '', 'width=220,height=100');

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
