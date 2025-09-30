import { blocks } from "./blocks-import.js";
import { getIndividualIcon } from "../../scripts/utils.js";

function decorateH2s(element) {
  element.querySelectorAll("h2").forEach((h2) => {
    const childEleTag =
      h2.childNodes.length === 1 && h2.firstElementChild?.tagName.toLowerCase();
    // contains only emphasized text
    if (childEleTag && (childEleTag === "em" || childEleTag === "i")) {
      h2.classList.add("h2--underline");
    }
  });
}

function decorateIconLinks(element){
    const lists = element.querySelectorAll('ul')
    
    lists.forEach(list =>{
        const li =list.querySelectorAll('li')
        const a = list.querySelectorAll('a')
        if(a){
            list.className = 'grid-row grid-gap-1 usa-list usa-list--unstyled';
            console.log(a)
            a.forEach(link =>{
                if(link.children[0].className.includes('icon')) {
                    li.forEach(element => {
                        element.classList.add('usa-icon-list__item')                        
                    });
               }

            })
        }
    })
}

function decorateButtons(element) {
  element.querySelectorAll("a").forEach((a) => {
    a.title = a.title || a.textContent;
    if (a.href !== a.textContent) {
      const up = a.parentElement;
      const twoup = a.parentElement.parentElement;
      if (!a.querySelector("img")) {
        if (
          up.childNodes.length === 1 &&
          (up.tagName === "P" || up.tagName === "DIV")
        ) {
          a.className = "usa-button"; // default
          up.classList.add("usa-button__wrap");
        }
        if (
          up.childNodes.length === 1 &&
          up.tagName === "STRONG" &&
          twoup.childNodes.length === 1 &&
          twoup.tagName === "P"
        ) {
          a.className = "usa-button usa-button--secondary";
          twoup.classList.add("usa-button__wrap");
        }
        if (
          up.childNodes.length === 1 &&
          up.tagName === "EM" &&
          twoup.childNodes.length === 1 &&
          twoup.tagName === "P"
        ) {
          a.className = "usa-button usa-button--outline";
          twoup.classList.add("usa-button__wrap");
        }
      }
    }
  });
}

function decorateIcons(element, prefix = "") {
  const icons = [...element.querySelectorAll("span.icon")];
  icons.forEach((span) => {
    decorateIcon(span, prefix);
  });
}

function decorateIcon(span, prefix = "", alt = '' ) {
  const iconName = Array.from(span.classList)
    .find((c) => c.startsWith("icon-"))
    .substring(5);

  getIndividualIcon(span, iconName);
}

function decorateBlock(block) {
  block.classList.add("usa-prose");
  const children = block.querySelectorAll(".side-bar >div >div");

  decorateH2s(block);
  decorateIcons(block);
  decorateIconLinks(block)

  decorateButtons(block);
  const buttons = block.querySelectorAll(".button");

  buttons.forEach((button) => {
    button.classList.replace("button", "usa-button");
  });

  children.forEach((element) => {
    let className = element.classList[0];

    if (className.includes("-")) {
      const arr = className.split("-");
      className = arr[0];
      for (let i = 1; i < arr.length; i++) {
        arr[i] = arr[i].replace(arr[i][0], arr[i][0].toUpperCase());
        className += arr[i];
      }
    }

    blocks[className](element);

    const arr = element.childNodes;
    arr.forEach((child) => {
      if (
        child.classList.contains("usa-card-group") ||
        child.classList.contains("icon-button-card-group")
      ) {
        const cards = child.querySelectorAll("li");

        cards.forEach((card) => {
          const string = card.classList.value;

          let newString = string
            .replace(/desktop:grid-col-\d+/g, "desktop:grid-col-12")
            .replace(/tablet:grid-col-\d+/g, "tablet:grid-col-12")
            .replace(/widescreen:grid-col-\d+/g, "widescreen:grid-col-12");

          card.classList.value = newString;
        });
      }
    });
  });
}

export async function loadSideBar(block) {
  const resp = await fetch(`/side-bar.plain.html`);

  if (resp.ok) {
    block.innerHTML = await resp.text();
    console.log(block);

    decorateBlock(block);

    return block;
  }
  return null;
}

export default async function decorate(block) {
  await loadSideBar(block);
}
