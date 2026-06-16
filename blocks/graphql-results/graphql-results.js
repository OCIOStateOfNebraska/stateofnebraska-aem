import { renderTable } from '../../scripts/graphql-table.js';

export default async function decorate( block ) {
	const [
		queryRow,
		pageSizeRow,
		headersRow,
		rowTemplateRow,
	] = block.children;
	const extractLink = ( el ) => el.querySelector( 'a[href]' );

	/** @type {HTMLAnchorElement | null} */
	const queryUrl = extractLink( queryRow );
	/** @type {number} */
	const pageSize = parseInt( pageSizeRow.children[1]?.innerText );
	/** @type {Array<string>} */
	const headers = [...headersRow.children].map( ( div ) => div.innerText.trim() );
	/** @type {Array<HTMLDivElement>} */
	const rowTemplate = [...rowTemplateRow.children];

	await renderTable( block, {
		queryUrl: queryUrl.href,
		pageSize,
		headers,
		rowTemplate,
		emptyMessage: 'There are no records that match your inquiry.',
	} );
}