export default async function decorate( doc ) {
	// const h1 = doc.querySelector('h1');
	// await buildPostData(h1);

	// const classes = ['section'];
	// const sidebarSection = createElement('div', classes, {
	//   'data-section-status': 'initialized',
	// });
	// const sidebarContainer = createElement('div');
	// sidebarSection.append(sidebarContainer);

	// let sidebarPreviousSection;
	// let sectionFound = false;
	// const sections = [...doc.querySelectorAll('.section')];
	// while (!sectionFound && sections.length > 0) {
	//   const section = sections.pop();
	//   if (!sidebarPreviousSection) {
	//     sidebarPreviousSection = section;
	//   } else if (section.classList.contains('related-content-container') || section.classList.contains('post-cards-container')) {
	//     sidebarPreviousSection = section;
	//   } else {
	//     sectionFound = true;
	//   }
	// }
	// const postSidebar = buildBlock('post-sidebar', '');
	// sidebarContainer.append(postSidebar);
	// sidebarPreviousSection.insertAdjacentElement('beforebegin', sidebarSection);
	// decorateBlock(postSidebar);
	const main = doc.querySelector( 'main' );
	main.classList.add( 'desktop:grid-col-9', 'usa-prose' );
}