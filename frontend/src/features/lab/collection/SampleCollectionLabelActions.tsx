/* eslint-disable no-restricted-syntax -- isolated print document HTML/CSS strings */
import type { Sample } from '@/types';
import { SAMPLE_TYPE_CONFIG, type SampleType } from '@/types/enums';
import { displayId } from '@/utils';
import { formatDateTime } from '@/utils/date';
import { feedbackTitle } from '@/feedback';

const LABEL_PAGE_WIDTH_IN = '1.42in';
const LABEL_PAGE_HEIGHT_IN = '0.68in';

export type SampleLabelPrintInput = {
  patientName: string;
  sample: Sample;
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
    padding: 2pt 3pt;
    background: #ffffff;
    color: #000000;
    font-family: Helvetica, Arial, sans-serif;
  }
  .label {
    width: 100%;
    color: #000000;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 1pt;
  }
  .label-line {
    margin: 0;
    padding: 0;
    color: #000000;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.15;
  }
  .label-name-type {
    font-size: 6.5pt;
    font-weight: 700;
    text-align: left;
  }
  .label-date {
    font-size: 5.5pt;
    font-weight: 500;
    text-align: left;
  }
  .label-barcode {
    display: flex;
    justify-content: center;
    width: 100%;
    line-height: 0;
  }
  .label-barcode svg {
    display: block;
    width: 100%;
    max-width: 1.32in;
    height: auto;
  }
  .label-sample-id {
    font-size: 6pt;
    font-weight: 700;
    text-align: center;
    letter-spacing: 0.03em;
  }
  @media screen {
    body {
      padding: 16px;
    }
  }
`;

export const generatePrintLabelHTML = ({ patientName, sample, eventAt }: SampleLabelPrintInput): string => {
  assertSampleLabelPrintable(sample);

  const sampleIdDisplay = displayId.sample(sample.sampleId);
  const sampleType = sampleTypeLabel(sample.sampleType || 'other').toUpperCase();
  const dateTime = resolveLabelDateTime(sample, eventAt);

  const safeDateTime = escapeHtml(dateTime);
  const safeSampleId = escapeHtml(sampleIdDisplay);
  const nameTypeLine = escapeHtml(`${patientName.trim() || 'Unknown'} - ${sampleType}`);
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
          <p class="label-line label-name-type">${nameTypeLine}</p>
          <p class="label-line label-date">${safeDateTime}</p>
          <div class="label-barcode">
            <svg id="barcode" role="img" aria-label="Barcode"></svg>
          </div>
          <p class="label-line label-sample-id">${safeSampleId}</p>
        </div>
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
              if (el) el.textContent = '';
            }
          })();
        </script>
      </body>
    </html>
  `;
};

export const printCollectionLabel = (input: SampleLabelPrintInput): void => {
  try {
    const htmlContent = generatePrintLabelHTML(input);
    const printWindow = window.open('', '', 'width=260,height=120');

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
