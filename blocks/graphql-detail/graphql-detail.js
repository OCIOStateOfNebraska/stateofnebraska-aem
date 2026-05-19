import { renderTable } from '../../scripts/graphql-table.js';
import { getIndividualIcon } from '../../scripts/utils.js';

/**
 * Builds the nav row that sits above the detail body:
 *   ←  :search: Back to Results          [ Print ]
 *
 * The italic/outline-button styling that authoring-time `decorateButtons`
 * would apply (em-wrapped link → `usa-button usa-button--outline`) is
 * applied directly here because the autoblocker only runs at page-decorate
 * time, not on DOM we build dynamically.
 */
function buildNav() {
	const nav = document.createElement( 'div' );
	nav.className = 'graphql-detail__nav';

	const backWrap = document.createElement( 'p' );
	backWrap.className = 'usa-button__wrap';
	const back = document.createElement( 'a' );
	back.className = 'usa-button graphql-detail__back';
	back.href = '#';
	back.addEventListener( 'click', ( e ) => {
		e.preventDefault();
		window.history.back();
	});
	const iconWrap = document.createElement( 'span' );
	iconWrap.className = 'usa-icon__wrap';
	iconWrap.setAttribute( 'aria-hidden', 'true' );
	getIndividualIcon( iconWrap, 'search' );
	back.append( iconWrap, ' Back to Results' );
	backWrap.append( back );

	const printWrap = document.createElement( 'p' );
	printWrap.className = 'usa-button__wrap';
	const printLink = document.createElement( 'a' );
	printLink.className = 'usa-button usa-button--outline';
	printLink.href = '#';
	const printIconWrap = document.createElement( 'span' );
	printIconWrap.className = 'usa-icon__wrap';
	printIconWrap.setAttribute( 'aria-hidden', 'true' );
	getIndividualIcon( printIconWrap, 'print' );
	printLink.append( printIconWrap, ' Print' );
	printLink.addEventListener( 'click', ( e ) => {
		e.preventDefault();
		window.print();
	});
	printWrap.append( printLink );

	nav.append( backWrap, printWrap );
	return nav;
}

export default async function decorate( block ) {
	const [
		queryRow,
		headingRow,
		headersRow,
		rowTemplateRow,
	] = block.children;
	const extractLink = ( el ) => el.querySelector( 'a[href]' );

	/** @type {HTMLAnchorElement | null} */
	const queryUrl = extractLink( queryRow );
	/** @type {HTMLElement} cell-2 of the heading row is the heading template */
	const heading = headingRow.children[1];
	/** @type {Array<string>} */
	const headers = [...headersRow.children].map( ( div ) => div.innerText.trim() );
	/** @type {Array<HTMLDivElement>} */
	const rowTemplate = [...rowTemplateRow.children];

	// Carve the block into a fixed nav row + a body container that
	// renderTable owns. renderTable's `replaceChildren` only touches the
	// body, so the nav row persists across spinner → result swap.
	const body = document.createElement( 'div' );
	body.className = 'graphql-detail__body';
	block.replaceChildren( buildNav(), body );

	await renderTable( body, {
		queryUrl: queryUrl.href,
		heading,
		headers,
		rowTemplate,
	});
}