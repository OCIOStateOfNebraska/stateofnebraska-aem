function createSummaryBoxBlock(main, document) {
	const summary = main.querySelector('.field .field--item .row .col-sm-12');
	if (summary) {
		const summaryContent = summary.innerHTML;
		const data = [
			['summary-box'],
			[summaryContent]
		];
		summary.replaceWith(WebImporter.DOMUtils.createTable(data, document));
	}
}

function createColumns(main, document) {
	const columns = main.querySelectorAll('.field .field--item .row .col-sm-6');
	let colData = [];
	if (columns) {
		columns.forEach((item) => {
			const div = document.createElement('div');
			const divContent = item.firstElementChild;
			div.append(divContent);
			colData.push(div);
		});
		console.log("Columns Data - {}", colData);
		const data = [
			['columns'],
			colData
		];
		columns.forEach((item, index) => {
			if (index === 0) {
				item.parentNode.replaceWith(WebImporter.DOMUtils.createTable(data, document));
			}
		});
	}
}

export default {
	transformDOM: ({
		document, url, html, params,
	}) => {
		const main = document.body;

		const hero = document.querySelector('.inside-hero');
		if (hero) {
			const hr = document.createElement('hr');
			hero.after(hr);
		}

		const parentH1 = document.querySelector('.inside-container .container .inside-title h1');
		const heading = document.querySelector('.region.region-title');
		if (parentH1 && heading) {
			parentH1.replaceWith(heading);
		}

		createSummaryBoxBlock(main, document);
		createColumns(main, document);

		WebImporter.DOMUtils.remove(main, [
			'.skip-link',
			'.navbar',
			'.tablet-search-container',
			'.mobile-search',
			'.breadcrumb-row',
			'a#main-content',
			'.footer'
		]);

		WebImporter.rules.createMetadata(main, document);
		WebImporter.rules.transformBackgroundImages(main, document);
		WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
		WebImporter.rules.convertIcons(main, document);

		return main;
  	},

  	generateDocumentPath: ({
		document, url, html, params,
	}) => {
		let p = new URL(url).pathname;
		if (p.endsWith('/')) {
			p = `${p}index`;
		}
		return decodeURIComponent(p)
			.toLowerCase()
			.replace(/\.html$/, '')
			.replace(/[^a-z0-9/]/gm, '-');
	},
};