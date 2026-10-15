import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
	slugifyFilePart,
	toDateInputValue,
	type StatusReportPayload
} from './status-report';

/**
 * Capture the report DOM and download a multi-page A4 PDF.
 * Clones the node onto `document.body` first — html2canvas breaks on ancestors
 * with CSS `transform` (e.g. centered dialogs).
 */
export async function downloadStatusReportPdf(
	element: HTMLElement,
	report: StatusReportPayload
) {
	const host = document.createElement('div');
	host.setAttribute('data-status-report-pdf-host', '');
	host.style.cssText = [
		'position:fixed',
		'left:-10000px',
		'top:0',
		'width:210mm',
		'padding:0',
		'margin:0',
		'background:#ffffff',
		'z-index:-1',
		'pointer-events:none'
	].join(';');

	const clone = element.cloneNode(true) as HTMLElement;
	clone.style.cssText = [
		'width:210mm',
		'max-width:210mm',
		'margin:0',
		'background:#ffffff',
		'color:#000000'
	].join(';');
	// Avoid interactive controls affecting layout in the clone.
	clone.querySelectorAll('input, button, textarea, select').forEach((node) => {
		(node as HTMLElement).style.pointerEvents = 'none';
	});

	host.appendChild(clone);
	document.body.appendChild(host);

	try {
		// Let layout settle (fonts / markdown).
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

		const canvas = await html2canvas(clone, {
			scale: 2,
			useCORS: true,
			allowTaint: true,
			backgroundColor: '#ffffff',
			logging: false,
			width: clone.scrollWidth,
			height: clone.scrollHeight,
			windowWidth: clone.scrollWidth,
			windowHeight: clone.scrollHeight
		});

		if (!canvas.width || !canvas.height) {
			throw new Error('Captura do relatório vazia.');
		}

		const imgData = canvas.toDataURL('image/png');
		const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

		const pageWidth = pdf.internal.pageSize.getWidth();
		const pageHeight = pdf.internal.pageSize.getHeight();
		const margin = 8;
		const contentWidth = pageWidth - margin * 2;
		const contentHeight = (canvas.height * contentWidth) / canvas.width;
		const pageContentHeight = pageHeight - margin * 2;

		let heightLeft = contentHeight;
		let position = margin;

		pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
		heightLeft -= pageContentHeight;

		while (heightLeft > 0.5) {
			position = margin - (contentHeight - heightLeft);
			pdf.addPage();
			pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
			heightLeft -= pageContentHeight;
		}

		const datePart = toDateInputValue(new Date(report.generatedAt));
		const name = `status-report-${slugifyFilePart(report.project.name) || 'projeto'}-${datePart}.pdf`;
		pdf.save(name);
	} finally {
		host.remove();
	}
}
