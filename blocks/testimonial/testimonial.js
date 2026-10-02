import { getMetadata } from '../../scripts/aem.js';
import { domEl } from '../../scripts/dom-helpers.js';
import { isFullWidthTemplate, getIndividualIcon } from '../../scripts/utils.js';

function generateContent(div, container) {
    const name = div.querySelector('h2, h3, h4, h5, h6');
    const body = div.querySelector('p');
    const title = div.querySelector('p:nth-of-type(1)');

    if (body) {
        const bodyText = domEl('div', { class: 'usa-card__body' }, body);
        container.prepend(bodyText);
    }

    if (name) {
        name.classList.add('usa-card__heading');
        const header = domEl('div', { class: 'usa-card__header' }, name);
        container.appendChild(header);
    }

    if (title) {
        const jobTitleText = domEl('div', { class: 'usa-card__subheader' }, title);
        container.appendChild(jobTitleText);
    }
}

function generateWholeCard(container) {
    [...container.children].forEach((div) => {
        generateContent(div, container);
    });
}

export default function decorate(block) {
    const count = block.children.length;
    const parent = block.parentElement;
    const layout = parent?.parentElement?.dataset?.layout;
    const fullWidth = isFullWidthTemplate(getMetadata);


    let grid = 'grid-col-12 tablet:grid-col-6 desktop:grid-col-4';

    if (layout) {
        const colClass = [...parent.classList].find(c => c.startsWith('desktop:grid-col-'));

        if (colClass) {
            const value = parseInt(colClass.replace('desktop:grid-col-', ''), 10);
            grid = value > 5
                ? 'grid-col-12 tablet:grid-col-6 desktop:grid-col-6'
                : 'grid-col-12 tablet:grid-col-6 desktop:grid-col-12';
        }
    } else {
        if (count >= 4 && fullWidth) {
            grid += ' widescreen:grid-col-3';
        }
    }

    const ul = domEl('ul', { class: 'usa-card-group grid-row' });

    [...block.children].forEach((col) => {
        const li = domEl('li', { class: `usa-card ${grid}` });
        const cardContainer = domEl('div', { class: 'usa-card__container' });

        if( col.firstElementChild.children.length === 0 ) {
            const quoteEl = domEl( 'div', { class: 'usa-icon usa-icon--star' }, '' )
            getIndividualIcon( quoteEl, 'format_quote' );
            cardContainer.prepend( quoteEl )
        }             

        [...col.firstElementChild.children].forEach((row) => {
            const starCount = parseFloat(row.textContent);
            row.remove(); // Clear the row content after extracting the star count
            const starList = domEl('ul', { class: 'usa-icon-list' });
            for (let i = 1; i <= 5; i++) {
                let starIcon = domEl('li', { class: 'usa-icon usa-icon--star' });
                if (i === starCount) {
                    getIndividualIcon(starIcon, 'star');
                }
                else if (i > starCount) {
                    if (i === Math.ceil(starCount) && i - 1 === Math.floor(starCount)) {
                        getIndividualIcon(starIcon, 'star_half');
                    } else {
                        getIndividualIcon(starIcon, 'star_outline');
                    }
                } else {
                    getIndividualIcon(starIcon, 'star');
                }
                starList.appendChild(starIcon);
            }
            
            cardContainer.append(starList);
            li.append(cardContainer);
        });

        [...col.children].forEach((item) => {
            const bodyText = item.querySelector('p');
            const author = item.querySelector('h2, h3, h4, h5, h6');
            const titleText = item.querySelector('p:last-of-type');

            if (bodyText) {
                bodyText.className = 'usa-card__body';                
                cardContainer.append(bodyText);
                li.append(cardContainer);
            }
            if (author) {
                const authorParagraph = domEl('p', { class: 'usa-card__heading' }, 
                    domEl('b', { class: 'usa-card__heading-text' }, author.textContent));
                cardContainer.append(authorParagraph);
                li.append(cardContainer);
            }
            if (titleText) {
                titleText.className = 'usa-card__subheader';
                cardContainer.append(titleText);
                li.append(cardContainer);
            }
        });


        generateWholeCard(cardContainer);
        ul.append(li);
    });


    block.textContent = '';
    block.append(ul);
}

