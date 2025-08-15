/* eslint-disable no-undef, no-unused-vars */
import { Sa11y, Lang } from './lib/sa11y.min.js';
import Sa11yLangEn from './lib/sa11y.lang.en.js';
import { loadCSS } from '../../../../scripts/aem.js';
import { createElement } from '../../../../scripts/scripts.js'; // eslint-disable-line import/no-cycle
import customChecks from './custom-checks/custom-checks.js';

let initializedCounter = 0;
let sa11y = null;

const sa11yElements = [
	'sa11y-control-panel',
	'sa11y-tooltips',
	'sa11y-dismiss-tooltip',
	'#sa11y-colour-filters',
	'sa11y-heading-label',
	'sa11y-heading-anchor',
];

const isPanelOpened = () => localStorage.getItem( 'sa11y-remember-panel' ) === 'Opened';

const createDialog = () => {
	const dialog = createElement( 'div', { id: 'hlx-a11y-mode-dialog' }, [
		createElement( 'div', { class: 'hlx-a11y-mode-dialog-container' }, [
			createElement( 'h4', { class: 'hlx-a11y-mode-dialog-title' }, 'Welcome to Accessibility Mode!' ),
			createElement( 'p', {}, 'Accessibility Mode is a tool that helps you to identify accessibility issues on your page. It scans the page from a content perspective and reports on things like missing alt text, missing headings, etc.' ),
			createElement( 'p', {}, 'Accessibility Mode is not a replacement for a full accessibility audit and does not guarantee compliance with a certain accessibility standard. It is a tool that helps you to identify and fix issues that can be fixed by content authoring.' ),
			createElement( 'p', {}, 'The page outline provides a hierarchical view of the page content. It is a great way to understand the structure of the page and to identify any issues with the page structure.' ),
			createElement( 'p', {}, 'The readability score provides an indication of how easy it is to read the content on the pag, and it is based on the Flesch Reading Ease test.' ),
			createElement( 'p', {}, 'Custom checks for EDS blocks can be added on a per project basis.' ),
			createElement( 'sup', {}, 'Note: This tool is extended from the open source project <a href="https://sa11y.netlify.app/overview/" target="_blank">Sa11y</a>.' ),
			createElement( 'div', { class: 'hlx-a11y-mode-dialog-actions' }, [
				createElement( 'button', { class: 'hlx-a11y-mode-dialog-button' }, 'Don’t Show Again' ),
			] ),
		] ),
	] );

	return dialog;
};

const initAccessibilityMode = async ( shouldActivateA11yMode ) => {
	const html = document.querySelector( 'html' );

	if ( shouldActivateA11yMode ) {
		await loadCSS( `${window.hlx.codeBasePath}/tools/sidekick/plugins/accessibility-mode/accessibility-mode.css` );

		if ( localStorage.getItem( 'hlx-a11y-mode-help' ) !== 'Disabled' ) {
			const helpDialog = createDialog();
			document.body.appendChild( helpDialog );

			const button = helpDialog.querySelector( '.hlx-a11y-mode-dialog-button' );

			button.addEventListener( 'click', () => {
				localStorage.setItem( 'hlx-a11y-mode-help', 'Disabled' );
				helpDialog.remove();
			} );
		}

		await loadCSS( `${window.hlx.codeBasePath}/tools/sidekick/plugins/accessibility-mode/lib/sa11y.min.css` );
		Lang.addI18n( Sa11yLangEn.strings );
		const isAlreadyInitialized = initializedCounter > 0;

		/**
     * NOTE: Sa11y has been extended to be able to toggle on and off via sidekick in preview mode.
     */
		// eslint-disable-next-line no-unused-vars
		sa11y = new Sa11y( {
			checkRoot: 'main',
			readabilityRoot: 'main',
			headless: isAlreadyInitialized,
			containerIgnore: '#hlx-a11y-mode-dialog',
			dismissAnnotations: false,
			headingMaxCharLength: 70,
			customChecks,
		} );

		if ( initializedCounter === 0 ) {
			initializedCounter += 1;
		}

		if ( isAlreadyInitialized ) {
			html.setAttribute( 'data-sa11y-active', 'true' );
			html.setAttribute( 'data-sa11y-theme', 'dark' );

			sa11yElements.forEach( ( selector ) => {
				const elements = document.querySelectorAll( selector );
				[...elements].forEach( ( element ) => {
					element.removeAttribute( 'style' );
				} );
			} );

			const sa11yAnnotations = document.querySelectorAll( 'sa11y-annotation' );

			[...sa11yAnnotations].forEach( ( element ) => {
				element.remove();
			} );

			if ( isPanelOpened() ) {
				const sa11yControlPanel = document.querySelector( 'sa11y-control-panel' );
				const panelContainer = sa11yControlPanel.shadowRoot.querySelector( '#panel' );
				panelContainer.classList.add( 'active' );
			}

			sa11y.checkAll();
		}
	} else {
		html.removeAttribute( 'data-sa11y-theme' );
		html.removeAttribute( 'data-sa11y-active' );

		[...sa11yElements].forEach( ( selector ) => {
			const elements = document.querySelectorAll( selector );
			[...elements].forEach( ( element ) => {
				element.style.display = 'none';
			} );
		} );

		const helpDialog = document.querySelector( '#hlx-a11y-mode-dialog' );
		const isDialogDisabled = localStorage.getItem( 'hlx-a11y-mode-help' ) !== 'Disabled';
		const shouldHideDialog = helpDialog && isDialogDisabled;

		if ( shouldHideDialog ) {
			helpDialog.remove();
		}

		sa11y.resetAll( false );
	}
};

export default initAccessibilityMode;
