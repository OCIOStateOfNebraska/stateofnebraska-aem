let runtimeImports = Promise.resolve();

function loadRuntime( url ) {
	const load = async () => {
		const hadCodeBasePath = Object.prototype.hasOwnProperty.call( window.hlx || {}, 'codeBasePath' );
		const codeBasePath = window.hlx?.codeBasePath;
		try {
			return await import( url );
		} finally {
			// AEM initializes this global when its module is first imported.
			if ( window.hlx ) {
				if ( hadCodeBasePath ) window.hlx.codeBasePath = codeBasePath;
				else delete window.hlx.codeBasePath;
			}
		}
	};
	runtimeImports = runtimeImports.then( load, load );
	return runtimeImports;
}

export class AEMEmbed extends HTMLElement {
	constructor() {
		super();
		this.initialized = false;
		this.loading = null;
		this.attachShadow( { mode: 'open' } );
	}

	connectedCallback() {
		if ( this.initialized || this.loading ) return;
		const controller = new AbortController();
		this.controller = controller;
		const aborted = new Promise( ( resolve, reject ) => {
			controller.signal.addEventListener( 'abort', () => reject( controller.signal.reason ), { once: true } );
		} );
		this.loading = Promise.race( [this.render( controller.signal ), aborted] )
			.then( () => {
				controller.signal.throwIfAborted();
				this.initialized = true;
				this.dispatchEvent( new CustomEvent( 'aem-embed-ready', { bubbles: true, composed: true } ) );
			} )
			.catch( ( error ) => {
				if ( controller.signal.aborted ) return;
				controller.abort();
				this.shadowRoot.replaceChildren();
				const message = document.createElement( 'p' );
				message.setAttribute( 'role', 'alert' );
				message.textContent = 'Unable to load embedded content.';
				this.shadowRoot.append( message );
				console.error( 'Failed to load aem-embed', error );
				this.dispatchEvent( new CustomEvent( 'aem-embed-error', {
					detail: { error },
					bubbles: true,
					composed: true,
				} ) );
			} )
			.finally( () => {
				this.loading = null;
				if ( controller.signal.aborted && this.isConnected && this.controller !== controller ) {
					this.connectedCallback();
				}
			} );
	}

	disconnectedCallback() {
		this.controller?.abort();
		this.controller = null;
		this.initialized = false;
	}

	async render( signal ) {
		const attribute = this.getAttribute( 'url' );
		if ( !attribute ) throw new Error( 'aem-embed requires a url attribute' );
		const pageUrl = new URL( attribute, document.baseURI );
		if ( !['http:', 'https:'].includes( pageUrl.protocol ) ) {
			throw new Error( 'aem-embed requires an HTTP(S) URL' );
		}
		const type = this.getAttribute( 'type' ) || 'main';
		if ( !['main', 'hero', 'header', 'footer'].includes( type ) ) {
			throw new Error( `Unsupported embed type: ${type}` );
		}
		pageUrl.hash = '';
		const codeBasePath = ( this.getAttribute( 'code-base-path' ) || '' ).replace( /^\/+|\/+$/g, '' );
		const sourceBase = new URL( codeBasePath ? `/${codeBasePath}/` : '/', pageUrl.origin ).href;
		const content = document.createElement( 'div' );
		content.className = 'aem-embed-content';
		content.hidden = true;
		content.dataset.origin = pageUrl.origin;
		content.dataset.codeBasePath = codeBasePath ? `/${codeBasePath}` : '';
		this.shadowRoot.replaceChildren( content );
		const { renderEmbed } = await loadRuntime( new URL( 'scripts/embed-runtime.js', sourceBase ).href );
		signal.throwIfAborted();
		await renderEmbed( { pageUrl, sourceBase, type, root: this.shadowRoot, container: content, signal } );
		signal.throwIfAborted();
		content.hidden = false;
	}
}

if ( !customElements.get( 'aem-embed' ) ) {
	customElements.define( 'aem-embed', AEMEmbed );
}
