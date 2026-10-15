import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
	slugifyFilePart,
	toDateInputValue,
	type StatusReportPayload
} from './status-report';

/**
 * Copy computed styles from a live node tree onto a clone as inline styles.
 * Browsers resolve `oklch()` / `color-mix()` to `rgb()` in getComputedStyle,
 * which html2canvas can parse (it crashes on raw oklch in stylesheets).
 */
function inlineComputedStyles(sourceRoot: HTMLElement, targetRoot: HTMLElement) {
	const sources = [sourceRoot, ...sourceRoot.querySelectorAll<HTMLElement>('*')];
	const targets = [targetRoot, ...targetRoot.querySelectorAll<HTMLElement>('*')];

	for (let i = 0; i < sources.length; i++) {
		const source = sources[i];
		const target = targets[i];
		if (!source || !target) continue;

		const computed = getComputedStyle(source);
		for (let p = 0; p < computed.length; p++) {
			const prop = computed.item(p);
			if (!prop) continue;
			try {
				target.style.setProperty(prop, computed.getPropertyValue(prop), computed.getPropertyPriority(prop));
			} catch {
				// Some properties are read-only on SVG etc. — skip.
			}
		}

		target.removeAttribute('class');
	}
}

function stripStylesheets(doc: Document) {
	doc.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove());
}

/**
 * Capture the report DOM and download a multi-page A4 PDF.
 * Clones off-dialog (avoids CSS transform ancestors) and inlines RGB styles
 * so html2canvas never has to parse Tailwind's `oklch()` tokens.
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
	clone.style.width = '210mm';
	clone.style.maxWidth = '210mm';
	clone.style.margin = '0';
	clone.style.background = '#ffffff';

	host.appendChild(clone);
	document.body.appendChild(host);

	try {
		inlineComputedStyles(element, clone);
		// Override layout after inlining — dialog constraints / transforms must not stick.
		clone.style.setProperty('width', '210mm', 'important');
		clone.style.setProperty('max-width', '210mm', 'important');
		clone.style.setProperty('margin', '0', 'important');
		clone.style.setProperty('transform', 'none', 'important');
		clone.style.setProperty('background-color', '#ffffff', 'important');

		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

		const canvas = await html2canvas(clone, {
			scale: 2,
			useCORS: true,
			allowTaint: true,
			backgroundColor: '#ffffff',
			logging: false,
			width: Math.max(clone.scrollWidth, 1),
			height: Math.max(clone.scrollHeight, 1),
			windowWidth: Math.max(clone.scrollWidth, 1),
			windowHeight: Math.max(clone.scrollHeight, 1),
			onclone: (clonedDoc) => {
				// Drop stylesheets so html2canvas never parses oklch rules.
				stripStylesheets(clonedDoc);
			}
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
