export default function decorate( block ) 
{
	const anchor = block.querySelector( 'a' );
	const link = anchor.href;
	anchor.textContent = '';
	const p = block.querySelector( '.embed>*:nth-child(1)' );
	const div = document.createElement( 'div' );

	if ( p.innerHTML !== '' && p.innerHTML !== null ) {
		div.innerHTML += p.innerHTML;
	}

	block.textContent = '';

	const getClassValue = ( prefix ) => {
		const c = [...block.classList].find( ( el ) => el.startsWith( prefix + '-' ) );
		return c ? c.split( '-' )[1] : null;
	};

	const fixedWidthClass = getClassValue( 'width' );
	const fixedHeightClass = getClassValue( 'height' );
	const mobileFixedWidthClass = getClassValue( 'mobilewidth' );
	const mobileFixedHeightClass = getClassValue( 'mobileheight' );
	const tabletFixedWidthClass = getClassValue( 'tabletwidth' );
	const tabletFixedHeightClass = getClassValue( 'tabletheight' );

	const urlWidthMatch = link.match( /[?&]width=(\d+)/i );
	const urlHeightMatch = link.match( /[?&]height=(\d+)/i );
	const urlW = urlWidthMatch ? Number( urlWidthMatch[1] ) : null;
	const urlH = urlHeightMatch ? Number( urlHeightMatch[1] ) : null;

	const container = document.createElement( 'div' );
	container.classList.add( 'iframe-container' );

	if ( urlH ) {
		container.style.setProperty( '--container-height', `${urlH}px` );
		container.style.setProperty( '--tablet-container-height', `${urlH}px` );
		container.style.setProperty( '--desktop-container-height', `${urlH}px` );
	}
	if ( mobileFixedHeightClass ) {
		container.style.setProperty(
			'--container-height',
			`${mobileFixedHeightClass}px`
		);
	}
	if ( tabletFixedHeightClass ) {
		container.style.setProperty(
			'--tablet-container-height',
			`${tabletFixedHeightClass}px`
		);
	}
	if ( fixedHeightClass ) {
		container.style.setProperty(
			'--desktop-container-height',
			`${fixedHeightClass}px`
		);
	}

	if ( urlW ) {
		container.style.setProperty( '--container-width', `${urlW}px` );
		container.style.setProperty( '--desktop-container-width', `${urlW}px` );
		container.style.setProperty( '--tablet-container-width', `${urlW}px` );
	}
	if ( fixedWidthClass ) {
		container.style.setProperty(
			'--desktop-container-width',
			`${fixedWidthClass}px`
		);
	}
	if ( mobileFixedWidthClass ) {
		container.style.setProperty(
			'--container-width',
			`${mobileFixedWidthClass}px`
		);
	}

	if ( tabletFixedWidthClass ) {
		container.style.setProperty(
			'--tablet-container-width',
			`${tabletFixedWidthClass}px`
		);
	}
	
	container.innerHTML = `
		<iframe
			src='${link}'
			style='border:0; width:100%; height:100%;'
			loading='lazy'
			allow='encrypted-media'
			allowfullscreen
			title='Embedded content'>
		</iframe>
	`;

	block.append( container );
	if ( div.textContent != '' ) block.append( div );
}
