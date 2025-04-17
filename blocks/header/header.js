import { getMetadata, decorateBlock, loadBlock, buildBlock, fetchPlaceholders } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import {  a, domEl } from '../../scripts/dom-helpers.js';

function decorateSkipnav( block, placeholders ) {
	const { skipnav } = placeholders;
	const skipNav = a( { class: 'usa-skipnav', href: '#main-content' }, skipnav ? skipnav : 'Skip to main content' );
	return skipNav;
}

async function loadBanner() {
	const bannerWrapper = domEl( 'div', { class: 'banner-wrap' } );
	const bannerBlock = buildBlock( 'banner', '' );

	bannerWrapper.appendChild( bannerBlock );
	decorateBlock( bannerBlock );

	return loadBlock( bannerBlock );
}

function createSubMenu(subMenu, id) {

  let listItem = subMenu.querySelectorAll("ul > li");
  if (listItem.length > 0) {
    const button = domEl( 'button', { class: 'usa-accordion__button usa-nav__link usa-current', type: 'button', 'aria-expanded': false, 'aria-controls': 'extended-mega-nav-section-' + id});
    const span = document.createElement('span');
    span.appendChild(subMenu.firstChild);
    button.append(span);
    subMenu.prepend(button);

    const subNav = domEl( 'div', { id: 'extended-mega-nav-section-' + id, class: 'usa-nav__submenu usa-megamenu'});
    const grid = domEl( 'div', { class: 'grid-row grid-gap-4'} );
    subNav.append(grid);
    subMenu.append(subNav);

    let column = "";
    let ul = "";
    for (const [index, element] of listItem.entries()) {
      if (index % 3 === 0) {
        column = domEl( 'div', { class: 'usa-col'});
        ul = domEl( 'ul', { class: 'usa-nav__submenu-list'});
        column.append(ul);
        grid.append(column);
      }
      ul.append(element);
      element.firstChild.classList.add('usa-nav-link');
    }
  } else {
    subMenu.firstChild.classList.add('usa-nav-link');
  }
  if (subMenu.querySelector('ul')) subMenu.querySelector('ul').remove();
}

function createSecondaryMenu(innerMenu) {
  const input = domEl( 'input', { class: 'usa-input', id: 'search-field', type: 'search', name: 'search'});
  const img = domEl( 'img', { class: 'usa-search__submit-icon', alt: 'Search', src: '../../icons/usa-icons/search.svg'});
  const searchButton = domEl( 'button', { class: 'usa-button', type: 'submit'});
  searchButton.append(img);
  const label = domEl( 'label', { class: 'usa-sr-only', for: 'search-field'});
  const form = domEl( 'form', { class: 'usa-search usa-search--small', role: 'search'});

  form.append(label);
  form.append(input);
  form.append(searchButton);
  let searchLabel = form.querySelector('.usa-sr-only');
  searchLabel.innerHTML = "Search";

  const secondaryNav = domEl( 'div', { class: 'usa-nav__secondary'});
  const ulLink = domEl( 'ul', { class: 'usa-nav__secondary-links'});
  const searchSection = domEl( 'section', { 'aria-label': 'Search component'});
  searchSection.append(form);
  secondaryNav.append(ulLink);
  secondaryNav.append(searchSection);
  innerMenu.append(secondaryNav);

  const closeImage = domEl( 'img', { role: 'img', alt: 'Close', src: '../../icons/usa-icons/close.svg'});
  const closeButton = domEl( 'button', { class: 'usa-nav__close', type: 'button'});
  closeButton.append(closeImage);
  innerMenu.prepend(closeButton);
}


// TODO: Leverage block
// eslint-disable-next-line no-unused-vars
async function loadAndDecorateNav( block ) {
	const navMeta = getMetadata( 'nav' );
  const navPath = navMeta ? new URL( navMeta, window.location ).pathname : '/nav';
  const navFragment = await loadFragment( navPath );
  const innerNav = domEl( 'div', { class: 'usa-nav__inner'});
  let navChildren = navFragment.children;
  for (const element of navChildren) {
    if (element.getElementsByTagName('ul').length > 0) {
      let ulList = element.getElementsByTagName('ul');
      innerNav.append(ulList[0]);
      break;
    }
  }
  innerNav.firstElementChild.classList.add('usa-nav__primary');
  innerNav.firstElementChild.classList.add('usa-accordion');
  innerNav.querySelectorAll('.usa-nav__primary > li').forEach((primaryItem, index) => {
    primaryItem.classList.add("usa-nav__primary-item");
    createSubMenu(primaryItem, index);
  });
  createSecondaryMenu(innerNav);
  const nav = domEl( 'nav', { class: 'usa-nav', 'aria-label': 'Primary navigation'});
  nav.append(innerNav);
  const navWrapper = domEl( 'div', { class: 'usa-header usa-header--extended'});
  navWrapper.append(nav);

  const em = domEl( 'em', { class: 'usa-logo__text'});
  em.append(navChildren[0]);
  const logo = domEl( 'div', { class: 'usa-logo'});
  logo.append(em);
  const navBar = domEl( 'div', { class: 'usa-navbar'});
  navBar.append(logo);
  const menuButton = domEl( 'button', { class: 'usa-menu-btn', type: 'button'});
  navBar.append(menuButton);
  let menu = navBar.querySelector('.usa-menu-btn');
  menu.innerHTML = 'Menu';
  navWrapper.prepend(navBar);
	return navWrapper;
}

async function loadAndDecorateAlert() {
	const alertMeta = getMetadata( 'alert' );
	if( !alertMeta ) { return null; }

	const alertPath = new URL( alertMeta, window.location ).pathname;
	const alertFragment = await loadFragment( alertPath );

	const alerts = alertFragment.querySelectorAll( '.alert-wrapper' );
	const alertContainer = domEl( 'div', { class: 'alert-container' } );

	// Adjust state classes that the block added - they're applied differently and are more on the global alerts
	Array.from( alerts ).forEach( wrap => {
		const alertEle = wrap.querySelector( '.usa-alert' );
		alertEle.parentNode.classList.add( 'usa-site-alert' );
		if( alertEle.classList.contains( 'usa-alert--emergency' ) ) {
			alertEle.classList.remove( 'usa-alert--emergency' );
			alertEle.parentNode.classList.add( 'usa-site-alert--emergency' );
		} else {
			alertEle.classList.remove( 'usa-alert--warning', 'usa-alert--error', 'usa-alert--success', 'usa-alert--info' );
			alertEle.parentNode.classList.add( 'usa-site-alert--info' );
		}

		alertEle.classList.remove( 'usa-alert--no-icon', 'usa-alert--slim' );

		alertContainer.append( wrap );
	} );

	return alerts.length && alertContainer;
}

/**
 * loads and decorates the header, including nav and global alerts
 * @param {Element} block The header block element
 */
export default async function decorate( block ) {
	const placeholders = await fetchPlaceholders();

	const skipNav = decorateSkipnav( block, placeholders );
	const alertEle = await loadAndDecorateAlert( block );
	const bannerEle = await loadBanner( block );
	const navEle = await loadAndDecorateNav( block );

	block.innerHTML = '';
  const overLay = document.createElement('div');
  overLay.className = 'usa-overlay';
	block.append( skipNav );
	if( alertEle ) { block.append( alertEle ); }
	block.appendChild( bannerEle );
	block.appendChild(overLay);
	block.appendChild( navEle );
}
