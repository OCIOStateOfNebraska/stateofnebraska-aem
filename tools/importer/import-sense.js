function buildCheckLicensePage(main, document) {
  // clear out any existing content
  main.innerHTML = '';

  // h1 heading
  const h1 = document.createElement('h1');
  h1.textContent = 'Check a License';
  main.appendChild(h1);

  // subheading (italic)
  const subheading = document.createElement('p');
  subheading.innerHTML = '<em>Find more information on the people and firms handling your money.</em>';
  main.appendChild(subheading);

  // help text
  const helpText = document.createElement('p');
  helpText.textContent = 'Call NDBF at 402-471-2171 or click on the links below.';
  main.appendChild(helpText);

  // section break
  main.appendChild(document.createElement('hr'));

  // card grid block (Franklin/Helix table, one row per card)
  const cardGridData = [
    ['info-card-grid'],
    [
      '<img src="https://images.unsplash.com/photo-1.jpg" alt="Bank">', '<a href="#">Bank</a>'
    ],
    [
      '<img src="https://images.unsplash.com/photo-2.jpg" alt="Credit Union">', '<a href="#">Credit Union</a>'
    ],
    [
      '<img src="https://images.unsplash.com/photo-3.jpg" alt="Money Transmitters">', '<a href="#">Money Transmitters</a>'
    ],
    [
      '<img src="https://images.unsplash.com/photo-4.jpg" alt="Mortgage Services">', '<a href="#">Mortgage Services</a>'
    ],
    [
      '<img src="https://images.unsplash.com/photo-5.jpg" alt="Investment Advisors">', '<a href="#">Investment Advisors</a>'
    ],
    [
      '<img src="https://images.unsplash.com/photo-6.jpg" alt="Broker-Dealers">', '<a href="#">Broker-Dealers</a>'
    ]
  ];
  main.append(WebImporter.DOMUtils.createTable(cardGridData, document));

  // section break
  main.appendChild(document.createElement('hr'));

  // alert (no-icon) block
  const alertData = [
    ['alert (no-icon)'],
    ['More About Financial Services In Nebraska', '<a href="#">Main Site</a>']
  ];
  main.append(WebImporter.DOMUtils.createTable(alertData, document));

  // section break
  main.appendChild(document.createElement('hr'));

  // metadata block
  const metaData = [
    ['metadata'],
    ['layout', ''],
    ['Title', 'Check a License'],
    ['Description', 'Check a License'],
    ['image', ''],
    ['keywords', ''],
    ['tags', '']
  ];
  main.append(WebImporter.DOMUtils.createTable(metaData, document));
}

export default {
  transform: ({ document }) => {
    const main = document.body;
    buildCheckLicensePage(main, document);
    return [{ element: main, path: '/check-a-license' }];
  }
}
