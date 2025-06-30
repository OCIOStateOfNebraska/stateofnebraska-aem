function addAlertBar(main, document) {
  const alertBar = document.createElement('div');
  alertBar.style.background = '#b31b4a';
  alertBar.style.color = '#fff';
  alertBar.style.padding = '8px 0';
  alertBar.innerHTML = '<strong>This is an emergency</strong><br><span>This is the body text of the emergency alert and a link? for testing</span>';
  main.append(alertBar);
}

function addHeader(main, document) {
  // Try to find the logo (by alt text or class)
  const logoImg = Array.from(document.querySelectorAll('img')).find(img =>
    img.alt && img.alt.toLowerCase().includes('nebraska')
  );

  // Try to find the navigation menu (by nav, ul, or class)
  const nav = document.querySelector('nav') ||
    Array.from(document.querySelectorAll('ul')).find(ul =>
      Array.from(ul.querySelectorAll('li')).some(li =>
        /home|get started|protect your money|news|check a license|file a complaint/i.test(li.textContent)
      )
    );

  // Try to find a search input
  const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');

  // Only create the header if at least one element exists
  if (logoImg || nav || searchInput) {
    const header = document.createElement('header');
    header.className = 'site-header';

    if (logoImg) {
      header.appendChild(logoImg.cloneNode(true));
    }

    if (nav) {
      header.appendChild(nav.cloneNode(true));
    }

    if (searchInput) {
      // Clone the search input and its parent form if available
      const form = searchInput.closest('form');
      if (form) {
        header.appendChild(form.cloneNode(true));
      } else {
        header.appendChild(searchInput.cloneNode(true));
      }
    }

    main.append(header);
  }
}

// this grabs the hero section if it exists
function addHeroSection(main, document) {
  // find the main hero heading and subheading
  const heroTitle = document.querySelector('h1');
  const heroSubtitle = document.querySelector('h2');
  const aboutLink = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase().includes('about this initiative'));

  if (heroTitle && heroSubtitle) {
    const hero = document.createElement('section');
    hero.className = 'hero-section';
    hero.appendChild(heroTitle.cloneNode(true));
    hero.appendChild(heroSubtitle.cloneNode(true));
    if (aboutLink) hero.appendChild(aboutLink.cloneNode(true));
    main.append(hero);
  }
}

// this one builds the columns for smart saver and fraud fighter
function addColumnsBlock(main, document) {
  // look for those two main columns
  const allBs = Array.from(document.querySelectorAll('b'));
  const saverHeader = allBs.find(b => b.textContent.trim().toLowerCase().includes('be a smart saver'));
  const fraudHeader = allBs.find(b => b.textContent.trim().toLowerCase().includes('be a fraud fighter'));

  if (saverHeader && fraudHeader) {
    // try to find the next sibling ul for each header
    const saverList = saverHeader.nextElementSibling && saverHeader.nextElementSibling.tagName === 'UL' ? saverHeader.nextElementSibling : null;
    const fraudList = fraudHeader.nextElementSibling && fraudHeader.nextElementSibling.tagName === 'UL' ? fraudHeader.nextElementSibling : null;
    const saverBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase().includes('get started'));
    const fraudBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase().includes('protect your money'));

    const col1 = `<b>${saverHeader.textContent}</b><br>${saverList ? saverList.outerHTML : ''}${saverBtn ? saverBtn.outerHTML : ''}`;
    const col2 = `<b>${fraudHeader.textContent}</b><br>${fraudList ? fraudList.outerHTML : ''}${fraudBtn ? fraudBtn.outerHTML : ''}`;

    const columnsData = [
      ['columns'],
      [col1, col2]
    ];
    main.append(WebImporter.DOMUtils.createTable(columnsData, document));
  }
}

// grabs the 'i want to' section if those links are around
function addWantSection(main, document) {
  // look for the 'i want to' links/buttons
  const checkLicense = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase().includes('check a license'));
  const fileComplaint = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase().includes('file a complaint'));
  const visitMain = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase().includes('main site'));

  if (checkLicense || fileComplaint || visitMain) {
    const wantSection = document.createElement('section');
    wantSection.className = 'want-section';
    wantSection.innerHTML = '<h2>I want to:</h2>';
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '32px';
    if (checkLicense) {
      const card = document.createElement('div');
      card.appendChild(checkLicense.cloneNode(true));
      container.appendChild(card);
    }
    if (fileComplaint) {
      const card = document.createElement('div');
      card.appendChild(fileComplaint.cloneNode(true));
      container.appendChild(card);
    }
    if (visitMain) {
      const card = document.createElement('div');
      card.appendChild(visitMain.cloneNode(true));
      container.appendChild(card);
    }
    wantSection.appendChild(container);
    main.append(wantSection);
  }
}

// this one finds the recent news section if it's there
function addNewsSection(main, document) {
  // look for the recent news heading
  const newsHeader = Array.from(document.querySelectorAll('h2, h3')).find(h => h.textContent.trim().toLowerCase().includes('recent news'));
  if (newsHeader) {
    const newsSection = document.createElement('section');
    newsSection.appendChild(newsHeader.cloneNode(true));
    // you could add news items here if you want
    main.append(newsSection);
  }
}

// footer, just grabs whatever looks like copyright or address
function addFooter(main, document) {
  // look for copyright or address
  const copyright = Array.from(document.querySelectorAll('footer, div, p')).find(e => e.textContent.trim().toLowerCase().includes('copyright'));
  if (copyright) {
    const footer = document.createElement('footer');
    footer.appendChild(copyright.cloneNode(true));
    main.append(footer);
  }
}

// this is the homepage builder, just calls the helpers above
function buildHomePage(main, document) {
  addAlertBar(main, document);
  addHeader(main, document);
  addHeroSection(main, document);
  addColumnsBlock(main, document);
  addWantSection(main, document);
  addNewsSection(main, document);
  addFooter(main, document);
}

// this builds the protect your money page
function buildProtectYourMoneyPage(main, document) {
  // Emergency alert and header (reuse logic)
  addHeader(main, document);

  // Main heading
  const mainHeading = Array.from(document.querySelectorAll('h1, h2')).find(h => h.textContent.trim().toLowerCase().includes('protect your money'));
  if (mainHeading) {
    main.appendChild(mainHeading.cloneNode(true));
  }

  // Card grid (find cards by class or structure)
  const cardTitles = Array.from(document.querySelectorAll('h3')).filter(h =>
    [
      'artificial intelligence and investment fraud',
      'how to report a scam or suspicious investment',
      'protect yourself from financial scams'
    ].some(title => h.textContent.trim().toLowerCase().includes(title))
  );
  if (cardTitles.length) {
    const cardGrid = document.createElement('div');
    cardGrid.className = 'card-grid';
    cardGrid.style.display = 'flex';
    cardGrid.style.gap = '24px';
    cardTitles.forEach(h => {
      const card = document.createElement('div');
      card.className = 'card';
      // Try to find the image above the title
      let img = h.previousElementSibling;
      if (img && img.tagName === 'IMG') {
        card.appendChild(img.cloneNode(true));
      }
      card.appendChild(h.cloneNode(true));
      // Find the next paragraph or description
      let desc = h.nextElementSibling;
      if (desc && desc.tagName === 'P') {
        card.appendChild(desc.cloneNode(true));
      }
      // Find the 'Read More' button
      const btn = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase() === 'read more' && a.closest('div') === h.parentElement);
      if (btn) {
        card.appendChild(btn.cloneNode(true));
      }
      cardGrid.appendChild(card);
    });
    main.appendChild(cardGrid);
  }

  // Expandable sections (e.g., More Alerts, Other Resource, Printable Assets)
  const expandableTitles = ['more alerts and advisories', 'other resource', 'printable assets'];
  expandableTitles.forEach(title => {
    const exp = Array.from(document.querySelectorAll('span, button, a')).find(e => e.textContent.trim().toLowerCase().includes(title));
    if (exp) {
      main.appendChild(exp.cloneNode(true));
    }
  });

  // Asset images (investment fraud flyers)
  const flyerImgs = Array.from(document.querySelectorAll('img')).filter(img =>
    img.alt && (img.alt.toLowerCase().includes('investment fraud') || img.alt.toLowerCase().includes('fraude de inversion'))
  );
  flyerImgs.forEach(img => {
    main.appendChild(img.cloneNode(true));
    // Try to find the next description
    let desc = img.nextElementSibling;
    if (desc && desc.tagName === 'P') {
      main.appendChild(desc.cloneNode(true));
    }
  });

  // Other assets (list of links)
  const assetLinks = Array.from(document.querySelectorAll('a')).filter(a =>
    [
      'tips to avoid investment fraud',
      'brochures',
      'how scammers steal your money',
      'potential signs of senior financial exploitation',
      'investment fraud awareness quiz',
      'cryptocurrency kiosk/atm oversight law'
    ].some(text => a.textContent.trim().toLowerCase().includes(text))
  );
  if (assetLinks.length) {
    const assetList = document.createElement('ul');
    assetLinks.forEach(a => {
      const li = document.createElement('li');
      li.appendChild(a.cloneNode(true));
      assetList.appendChild(li);
    });
    main.appendChild(assetList);
  }

  // More About Financial Services section
  const moreAbout = Array.from(document.querySelectorAll('h2, h3')).find(h => h.textContent.trim().toLowerCase().includes('more about financial services'));
  if (moreAbout) {
    main.appendChild(moreAbout.cloneNode(true));
    const mainSiteBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase().includes('main site'));
    if (mainSiteBtn) {
      main.appendChild(mainSiteBtn.cloneNode(true));
    }
  }

  // Footer (reuse logic)
  addFooter(main, document);
}

// this builds the check a license page
function buildCheckLicensePage(main, document) {
  // Emergency alert and header (reuse logic)
  addHeader(main, document);

  // Main heading (Check a License)
  const mainHeading = Array.from(document.querySelectorAll('h1, h2')).find(h => h.textContent.trim().toLowerCase().includes('check a license'));
  if (mainHeading) {
    main.appendChild(mainHeading.cloneNode(true));
  }

  // Subheading (Find more information...)
  const subHeading = Array.from(document.querySelectorAll('h2, h3, p, div')).find(e => e.textContent.trim().toLowerCase().includes('find more information on the people'));
  if (subHeading) {
    main.appendChild(subHeading.cloneNode(true));
  }

  // Phone number (Call NDBF...)
  const phoneText = Array.from(document.querySelectorAll('p, div, span')).find(e => /call ndbf at/i.test(e.textContent));
  if (phoneText) {
    main.appendChild(phoneText.cloneNode(true));
  }

  // Card grid (Bank, Credit Union, Money Transmitters, Mortgage Services, Investment Advisors, Broker-Dealers)
  const cardTitles = [
    'bank',
    'credit union',
    'money transmitters',
    'mortgage services',
    'investment advisors',
    'broker-dealers'
  ];
  // Find all cards by link text
  const cardLinks = cardTitles.map(title =>
    Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase() === title)
  ).filter(Boolean);
  if (cardLinks.length) {
    const cardGrid = document.createElement('div');
    cardGrid.className = 'card-grid';
    cardGrid.style.display = 'flex';
    cardGrid.style.flexWrap = 'wrap';
    cardGrid.style.gap = '24px';
    cardLinks.forEach(link => {
      const card = document.createElement('div');
      card.className = 'card';
      // Try to find the image above the link
      let img = link.previousElementSibling;
      if (img && img.tagName === 'IMG') {
        card.appendChild(img.cloneNode(true));
      }
      card.appendChild(link.cloneNode(true));
      cardGrid.appendChild(card);
    });
    main.appendChild(cardGrid);
  }

  // More About Financial Services In Nebraska section
  const moreAbout = Array.from(document.querySelectorAll('h2, h3, div')).find(h => h.textContent.trim().toLowerCase().includes('more about financial services'));
  if (moreAbout) {
    main.appendChild(moreAbout.cloneNode(true));
    const mainSiteBtn = Array.from(document.querySelectorAll('a, button')).find(a => a.textContent.trim().toLowerCase().includes('main site'));
    if (mainSiteBtn) {
      main.appendChild(mainSiteBtn.cloneNode(true));
    }
  }

  // Footer (reuse logic)
  addFooter(main, document);
}

// this builds the finfluencer article page
function buildFinfluencerPage(main, document) {
  // Emergency alert and header (reuse logic)
  addHeader(main, document);

  // Main heading (Financial Advice on Social Media...)
  const mainHeading = Array.from(document.querySelectorAll('h1, h2')).find(h => h.textContent.trim().toLowerCase().includes('financial advice on social media'));
  if (mainHeading) {
    main.appendChild(mainHeading.cloneNode(true));
  }

  // All subheadings and paragraphs (What is a Financial Influencer, What to Consider, Red Flags, Where to Go for Help, etc.)
  const contentSections = Array.from(document.querySelectorAll('h2, h3, h4, p, ul, ol')).filter(e => {
    const text = e.textContent.trim().toLowerCase();
    return (
      text.includes('what is a financial influencer') ||
      text.includes('what to consider') ||
      text.includes('red flags') ||
      text.includes('where to go for help') ||
      text.includes('finfluencer') ||
      text.includes('should disclose') ||
      text.includes('dubious advice') ||
      text.includes('credentials check') ||
      text.includes('show me the stonks') ||
      text.includes('if you have concerns') ||
      (e.tagName === 'P' && text.length > 40) // likely a body paragraph
    );
  });
  contentSections.forEach(e => {
    main.appendChild(e.cloneNode(true));
  });

  // More About Financial Services In Nebraska section
  const moreAbout = Array.from(document.querySelectorAll('h2, h3, div')).find(h => h.textContent.trim().toLowerCase().includes('more about financial services'));
  if (moreAbout) {
    main.appendChild(moreAbout.cloneNode(true));
    const mainSiteBtn = Array.from(document.querySelectorAll('a, button')).find(a => a.textContent.trim().toLowerCase().includes('main site'));
    if (mainSiteBtn) {
      main.appendChild(mainSiteBtn.cloneNode(true));
    }
  }

  // Footer (reuse logic)
  addFooter(main, document);
}

export default {
  transform: ({ document, url }) => {
    const results = [];
    // Homepage
    const mainHome = document.createElement('main');
    buildHomePage(mainHome, document);
    results.push({ element: mainHome, path: '/index' });
    // Protect Your Money page
    const mainProtect = document.createElement('main');
    buildProtectYourMoneyPage(mainProtect, document);
    results.push({ element: mainProtect, path: '/protect-your-money' });
    // Check a License page
    const mainCheck = document.createElement('main');
    buildCheckLicensePage(mainCheck, document);
    results.push({ element: mainCheck, path: '/check-a-license' });
    // Finfluencer article page
    const mainFinfluencer = document.createElement('main');
    buildFinfluencerPage(mainFinfluencer, document);
    results.push({ element: mainFinfluencer, path: '/finfluencer' });
    return results;
  }
}