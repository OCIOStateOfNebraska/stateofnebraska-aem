import { span } from '../../scripts/dom-helpers.js';

export default function decorate( block ) {
	const cell = block.querySelector( ':scope > div > div' );
	const label = cell?.textContent.trim() ?? '';

	block.textContent = '';

	if ( label ) {
		block.classList.add( 'divider--labeled' );
		block.append(
			span( { class: 'divider__line' } ),
			span( { class: 'divider__label' }, label ),
			span( { class: 'divider__line' } ),
		);
	} else {
		block.append( span( { class: 'divider__line' } ) );
	}

	// Orient perpendicular to the parent's layout axis by measuring our own slot.
	// A taller-than-wide slot means siblings are arranged horizontally → divider is vertical.
	const observer = new ResizeObserver( ( [entry] ) => {
		const { width, height } = entry.contentRect;
		if ( width === 0 || height === 0 ) return;
		block.dataset.orientation = width > height ? 'horizontal' : 'vertical';
	} );
	observer.observe( block );
}