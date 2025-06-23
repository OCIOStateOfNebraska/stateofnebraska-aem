function buildHomePage(main, document) {
  // 1. H1
  const h1 = document.createElement('h1');
  h1.textContent = 'Make Cents Make Sense';
  main.append(h1);

  // 2. Hero Image
  const img = document.createElement('img');
  img.src = 'https://images.unsplash.com/photo-hero.jpg';
  main.append(img);

  // 3. About link
  const about = document.createElement('a');
  about.href = '#'; // or actual link
  about.textContent = 'About this Initiative.';
  main.append(about);

  // 4. Section Break - you could add an <hr> or use a special section-break block if required
  main.append(document.createElement('hr'));

  // 5. Columns block
  const columnsData = [
    ['columns'],
    [
      `<b>Be a Smart Saver and Investor</b><br>Save and grow your money:<ul>
        <li>:check: Create a budget</li>
        <li>:check: Leverage the power of compound interest</li>
        <li>:check: Make an investment plan</li>
        <li>:check: Learn about investment products</li>
      </ul><a href="#">Get Started</a>`,
      `<b>Be a Fraud Fighter</b><br>Protect your money and investments:<ul>
        <li>:check: Spot signs of frauds and scams</li>
        <li>:check: Understand how scams work</li>
        <li>:check: Know what questions to ask</li>
        <li>:check: What to do if you are a victim of a scam</li>
      </ul><a href="#">Protect Your Money</a>`
    ]
  ];
  main.append(WebImporter.DOMUtils.createTable(columnsData, document));

  // And so on, for each block...
}

export default {
  transform: ({ document, url }) => {
    const main = document.body;
    buildHomePage(main, document);
    // append metadata etc.
    return [{ element: main, path: '/index' }];
  }
}