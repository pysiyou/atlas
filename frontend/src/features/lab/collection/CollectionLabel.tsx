import type { SampleDisplay } from '../types';
import { CONTAINER_COLOR_OPTIONS, isCollectedSample } from '@/types';
import { displayId } from '@/utils/id-display';

/**
 * Generates HTML content for printing a sample label
 */
export const generatePrintLabelHTML = (display: SampleDisplay, patientName: string): string => {
  const { sample, order } = display;

  if (!sample || !isCollectedSample(sample)) {
    throw new Error('Cannot print label for uncollected sample');
  }

  const sampleId = sample.sampleId;
  const sampleIdDisplay = displayId.sample(sampleId);
  const patientIdDisplay = displayId.patient(order.patientId);
  const sampleType = sample.sampleType || 'unknown';
  const containerTopColor = sample.actualContainerColor;
  const containerType = sample.actualContainerType;

  const colorName =
    CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerTopColor)?.name || 'N/A';

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString();
  const formattedTime = currentDate.toLocaleTimeString();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Label - ${sampleIdDisplay}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
        <style>
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
      <body class="bg-white m-0 p-0">
        <div class="label-wrapper">
          <div class="w-full max-w-[3.75in] flex flex-col items-center justify-center gap-1.5 p-2 border border-dashed border-gray-300 print:border-none print:max-w-full print:p-0">
            <!-- Patient Name -->
            <div class="text-sm font-bold text-center text-gray-900 leading-snug w-full">
              ${patientName}
            </div>

            <!-- Patient ID and Sample Type -->
            <div class="text-xxs text-gray-600 text-center leading-tight">
              ${patientIdDisplay} | ${sampleType.toUpperCase()}
            </div>

            <!-- Container Info -->
            <div class="w-full text-xxs font-bold text-center text-gray-800 bg-gray-100 rounded px-2 py-1 print:py-0.5">
              ${containerType.toUpperCase()}: ${colorName.toUpperCase()}
            </div>

            <!-- Barcode -->
            <div class="flex justify-center items-center w-full py-0.5">
              <svg id="barcode" class="max-w-full h-auto"></svg>
            </div>

            <!-- Sample ID -->
            <div class="text-xxs text-gray-600 text-center leading-tight">
              ${sampleIdDisplay}
            </div>

            <!-- Date and Time -->
            <div class="text-[9px] text-gray-500 text-center leading-tight">
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
              // Barcode generation error - display fallback in UI
              document.getElementById('barcode').innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="red" font-size="10">Barcode Error</text>';
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
export const printCollectionLabel = (display: SampleDisplay, patientName: string): void => {
  try {
    const htmlContent = generatePrintLabelHTML(display, patientName);
    const printWindow = window.open('', '', 'width=400,height=250');

    if (!printWindow) {
      throw new Error('Please allow popups to print labels');
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to print label');
  }
};
