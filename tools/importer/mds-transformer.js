import { getAdjacentElements, getAdjacentElementsBySelector, replaceHeadings, } from '../importer/importer-utils.js';
import * as mdsBlocks from './mds-blocks.js';

/**
 * Transforms groups of adjacent elements matching the panelSelector into accordions, 
 * using the panelTitleSelector for the accordion title and panelContentSelector for 
 * the content. All headings within the content are transformed to be one level below the accordion header.
 * @param {Element} main 
 * @param {string} panelSelector  - selector to identify elements that should be grouped into an accordion item
 * @param {string} panelTitleSelector - selector to identify the element within the panel that contains the title for the accordion header
 * @param {string} panelContentSelector - selector to identify the element within the panel that contains the content for the accordion body
 */
export function transformAccordion( main, panelSelector, panelTitleSelector, panelContentSelector ) {
	const headerLevel = 2;  
	const accordionItems = getAdjacentElementsBySelector( main, panelSelector );

	accordionItems.forEach( ( group, groupIndex, groupArr ) => { 
		const items = [];
		group.forEach( ( faqItem, itemIndex, itemArr ) => { // Accordions that are adjacent to each other
			const headingText = faqItem.querySelector( panelTitleSelector ).innerText;
			const content = document.createElement( 'div' );
				
			const accordionPanel = faqItem.querySelector( panelContentSelector );
			accordionPanel && Array.from( accordionPanel.children ).forEach( ( child ) => {
				content.appendChild( child );
			} );
				
			const header = document.createElement( `h${headerLevel}` );
			header.innerText = headingText;
			items.push( {
				heading: header,
				content: replaceHeadings( content, headerLevel + 1 )
			} );
				
			if( itemIndex > 0 ) { // Keep first element to replace with accordion, remove others
				itemArr[itemIndex].remove(); 
			}
		} );
		const accordion = mdsBlocks.createAccordion( items );
		groupArr[groupIndex][0].replaceWith( accordion );
	} );
}

/**
 * Transforms tables given a selector while removing empty rows.
 * @param {Element} main 
 * @param {string} tableSelector - selector to identify tables to transform
 * @param {Object} [options] - options
 * @param {string} [options.variant] - variant for table, e.g. 'scrollable'
 * @param {string} [options.caption] - caption for table 
 */
export function transformTable( main, tableSelector, options ) {
	const tables = main.querySelectorAll( tableSelector );
	
	tables.forEach( ( table ) => {
		const newTblRows = [];
		const oldTblRows = table.querySelectorAll( 'tr' );
					
		oldTblRows.forEach( ( row, rowIndex ) => {
						
			row.querySelectorAll( 'th, td' ).forEach( ( cell, cellIndex ) => {
				const wrapper = document.createElement( 'div' );
				wrapper.innerHTML = cell.innerHTML;
				// Skip empty cells, but keep empty cells in first two rows to preserve table structure (headers)
				if ( wrapper.innerHTML.trim() === '' && rowIndex > 1 ) { 
					return;
				}
							
				if ( cellIndex === 0 ) {
					newTblRows.push( [] );
				}
				newTblRows[rowIndex].push( wrapper );
			} );
		} );
		const tableBlock = mdsBlocks.createTable( newTblRows, options );
		tableBlock.querySelectorAll( 'table table tr' ).forEach( ( tr, rowIndex ) => {
			if( rowIndex > 1 && tr.textContent.trim() === '' ) { // Remove empty rows, but keep empty rows in first two rows to preserve table structure (header)
				tr.remove();
			}
		} );
		table.replaceWith( tableBlock );
	} );
}

/**
 * Transforms groups of adjacent paragraphs (and interleaved link-only lists) that contain a list of links, into a
 * single unordered list. This prevents AEM's decorateButtons() from converting
 * resource links into lots of buttons.
 *
 * A \<p> qualifies if it contains exactly one <a> with no meaningful text outside it —
 * wrapper spans and whitespace are ignored via textContent comparison.
 * A \<ul> qualifies if every \<li> contains exactly one <a> with no other text.
 * Adjacent groups of qualifying elements are merged into one \<ul>.
 * Groups with no \<p> element (standalone \<ul>) or fewer than minGroupSize total
 * links are left untouched.
 *
 * @param {Element} main - The container element to search within
 * @param {number} [minGroupSize=2] - Minimum total links required to form a list
 */
export function transformLinkParagraphsToList( main, minGroupSize = 2 ) {

	function isLinkOnlyParagraph( p ) {
		const anchors = p.querySelectorAll( 'a' );
		return anchors.length === 1 && p.textContent.trim() === anchors[0].textContent.trim();
	}

	function isLinkOnlyList( ul ) {
		const lis = ul.querySelectorAll( ':scope > li' );
		if ( lis.length === 0 ) return false;
		return [...lis].every( ( li ) => {
			const anchors = li.querySelectorAll( 'a' );
			return anchors.length === 1 && li.textContent.trim() === anchors[0].textContent.trim();
		} );
	}

	// Collect all qualifying <p> and <ul> elements
	const candidates = [...main.querySelectorAll( 'p, ul' )].filter( ( el ) => {
		if ( el.tagName === 'P' ) return isLinkOnlyParagraph( el );
		if ( el.tagName === 'UL' ) return isLinkOnlyList( el );
		return false;
	} );

	const groups = getAdjacentElements( candidates );

	groups.forEach( ( group ) => {
		// Skip groups that are only existing <ul> elements — they don't need transformation
		if ( !group.some( ( el ) => el.tagName === 'P' ) ) return;

		// Count total links across all elements in the group
		let totalLinks = 0;
		group.forEach( ( el ) => {
			if ( el.tagName === 'P' ) totalLinks++;
			else if ( el.tagName === 'UL' ) totalLinks += el.querySelectorAll( ':scope > li' ).length;
		} );
		if ( totalLinks < minGroupSize ) return;

		const ul = document.createElement( 'ul' );
		group.forEach( ( el ) => {
			if ( el.tagName === 'P' ) {
				const anchor = el.querySelector( 'a' );
				// eslint-disable-next-line no-self-assign
				anchor.textContent = anchor.textContent; // Unwraps inner elements
				const li = document.createElement( 'li' );
				li.appendChild( anchor );
				ul.appendChild( li );
			} else if ( el.tagName === 'UL' ) {
				el.querySelectorAll( ':scope > li' ).forEach( ( existingLi ) => {
					const anchor = existingLi.querySelector( 'a' );
					// eslint-disable-next-line no-self-assign
					anchor.textContent = anchor.textContent; // Unwraps inner elements
					const li = document.createElement( 'li' );
					li.appendChild( anchor );
					ul.appendChild( li );
				} );
			}
		} );

		group[0].replaceWith( ul );
		for ( let i = 1; i < group.length; i++ ) {
			group[i].remove();
		}
	} );
}

export default {
	transformAccordion,
	transformLinkParagraphsToList,
	transformTable,
};