import {
  getMetadata,
} from '../../scripts/aem.js';

export default function decorate(block) {
  const setType = getMetadata('domain');
  let type = 'gov';
  if (setType === 'mil') {
    type = 'mil';
  } else {
    type = 'gov';
  }
  let bannerText;
  let buttonText;
  let officialText;
  let secureText;
  if (/^es\b/.test(navigator.language)) {
    bannerText = 'Un sitio oficial del Gobierno de Estados Unidos';
    buttonText = 'Así es como usted puede verificarlo';
    officialText = `<strong>Los sitios web oficiales usan .${type}</strong><br/>Un sitio web <strong>.${type}</strong> pertenece a una organización oficial del Gobierno de Estados Unidos.`;
    secureText = `<strong>Los sitios web seguros .${type} usan HTTPS</strong><br/>Un <strong>candado</strong> (  <span class="icon-lock"><svg xmlns="http://www.w3.org/2000/svg" width="52" height="64" viewBox="0 0 52 64" class="usa-banner__lock-image" role="img" aria-labelledby="banner-lock-description" focusable="false"><title id="banner-lock-title">Lock</title><desc id="banner-lock-description">Locked padlock icon</desc><path fill="#000000" fill-rule="evenodd" d="M26 0c10.493 0 19 8.507 19 19v9h3a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V32a4 4 0 0 1 4-4h3v-9C7 8.507 15.507 0 26 0zm0 8c-5.979 0-10.843 4.77-10.996 10.712L15 19v9h22v-9c0-6.075-4.925-11-11-11z"/></svg></span>) o <strong>https://</strong> significa que usted se conectó de forma segura a un sitio web .${type}.  Comparta información sensible sólo en sitios web oficiales y seguros.`;
  } else {
    bannerText = 'An official website of the United States government';
    buttonText = 'Here\'s how you know';
    officialText = `<strong>Official websites use .${type}</strong><br/>A <strong>.${type}</strong> website belongs to an official government organization in the United States.`;
    secureText = `<strong>Secure .${type} websites use HTTPS</strong><br/>A <strong>lock</strong> (  <span class="icon-lock"><svg xmlns="http://www.w3.org/2000/svg" width="52" height="64" viewBox="0 0 52 64" class="usa-banner__lock-image" role="img" aria-labelledby="banner-lock-description" focusable="false"><title id="banner-lock-title">Lock</title><desc id="banner-lock-description">Locked padlock icon</desc><path fill="#000000" fill-rule="evenodd" d="M26 0c10.493 0 19 8.507 19 19v9h3a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V32a4 4 0 0 1 4-4h3v-9C7 8.507 15.507 0 26 0zm0 8c-5.979 0-10.843 4.77-10.996 10.712L15 19v9h22v-9c0-6.075-4.925-11-11-11z"/></svg></span>) or <strong>https://</strong> means you've safely connected to the .${type} website. Share sensitive information only on official, secure websites.`;
  }
  const banner = document.createElement('section');
  banner.className = 'usa-banner';
  banner.setAttribute('aria-label', bannerText);
  const accordion = document.createElement('div');
  accordion.className = 'usa-accordion';
  const header = document.createElement('header');
  header.className = 'usa-banner__header';
  const inner = document.createElement('div');
  inner.className = 'usa-banner__inner';
  const grid = document.createElement('div');
  grid.className = 'grid-col-auto';
  const flag = document.createElement('img');
  flag.className = 'usa-banner__header-flag';
  flag.setAttribute('aria-hidden', 'true');
  flag.setAttribute('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAsCAIAAABaPSmoAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAQKADAAQAAAABAAAALAAAAAA5W/rGAAABlElEQVRoBe2ZTU4DMQyFYzTLXoHOhhsAW24AR4GzFdb8iC2cABaoPUYXDFKlJt+TSJtZpFEkd+W4jhPnOX5Jxs4vV2H/M7O9GMI0JRkStbAOooef98V97L39pVVUh7yfZJOZTjhLJn1KHkBr3Abm3/rjNs5nvHqM8vrzLspZ/fVTtOH+GV9/kr6C5ClUYVFnueweAVuCByR01HLmtNgUNJ4XD9FqQjHn3vufHWK3nZCbTvcIeAAK9OlbQ0ByMUc3BZywBFdsyBXghIs354GDsPoeOLg8J/jTmMfcA6zTnAdrtthgL5E3yAPUix9xlEYDbWTvDJ5Cab3aSN0jMDAvpZajxhfdB2BPbnEeOJKZ3adQ9wGYvAsBLqnTBXqYyBvRC96FpK6j9lNPPyVy9wh4ACUw17Qxnn9qDlTLt6dQrZUt9ds9AvZ1Mx4NVr4boMrPrd+ZKwOPTjyaybxyfbtHwAMQnBs0nAcaLLoM6XtAlqNBw77BA3IHyJzXhRNyRIC+oI3Agj/3DMZx2ddTqEHWyJDdI/AHdI1y3pPhjf8AAAAASUVORK5CYII=');
  flag.setAttribute('alt', '');
  flag.setAttribute('width', '16');
  flag.setAttribute('height', '11');
  grid.append(flag);
  const col = document.createElement('div');
  col.classList.add('grid-col-fill', 'tablet:grid-col-auto');
  col.setAttribute('aria-hidden', 'true');
  const text = document.createElement('p');
  text.className = 'usa-banner__header-text';
  text.innerText = bannerText;
  const action = document.createElement('p');
  action.className = 'usa-banner__header-action';
  action.innerText = buttonText;
  col.append(text, action);
  const button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.classList.add('usa-banner__button', 'usa-accordion__button');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'gov-banner-default');
  const btnText = document.createElement('span');
  btnText.className = 'usa-banner__button-text';
  btnText.innerText = buttonText;

  button.append(btnText);
  inner.append(grid);
  inner.append(col);
  inner.append(button);
  header.append(inner);
  accordion.append(header);

  // dropdown content
  const dropdown = document.createElement('div');
  dropdown.classList.add('usa-banner__content', 'usa-accordion__content');
  dropdown.id = 'gov-banner-default';
  dropdown.setAttribute('hidden', '');
  const row = document.createElement('div');
  row.classList.add('grid-row', 'grid-gap-lg');
  const col1 = document.createElement('div');
  col1.classList.add('usa-banner__guidance', 'tablet:grid-col-6');
  const col1Img = document.createElement('img');
  col1Img.classList.add('usa-banner__icon', 'usa-media-block__img');
  col1Img.setAttribute('aria-hidden', 'true');
  col1Img.setAttribute('role', 'img');
  col1Img.setAttribute('alt', '');
  col1Img.src = '/icons/icon-dot-gov.svg';
  col1.append(col1Img);
  const col1Body = document.createElement('div');
  col1Body.classList.add('usa-media-block__body');
  const col1Text = document.createElement('p');
  col1Text.innerHTML = officialText;
  col1Body.append(col1Text);
  col1.append(col1Body);
  row.append(col1);

  const col2 = document.createElement('div');
  col2.classList.add('usa-banner__guidance', 'tablet:grid-col-6');
  const col2Img = document.createElement('img');
  col2Img.classList.add('usa-banner__icon', 'usa-media-block__img');
  col2Img.setAttribute('aria-hidden', 'true');
  col2Img.setAttribute('role', 'img');
  col2Img.setAttribute('alt', '');
  col2Img.src = '/icons/icon-https.svg';
  col2.append(col2Img);
  const col2Body = document.createElement('div');
  col2Body.classList.add('usa-media-block__body');
  const col2Text = document.createElement('p');
  col2Text.innerHTML = secureText;
  col2Body.append(col2Text);
  col2.append(col2Body);
  row.append(col2);
  dropdown.append(row);
  accordion.append(dropdown);
  banner.append(accordion);
  block.textContent = '';
  block.append(banner);
}
