export default {
  transform: ({
    // eslint-disable-next-line no-unused-vars
    document,
    url,
  }) => {
    const main = document.body;
    const results = [];

    // find pdf links
    main.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && href.endsWith('.pdf') && href.startsWith('https://ndbf.nebraska.gov/')) {
        const u = new URL(href, url);
        const newPath = WebImporter.FileUtils.sanitizePath(u.pathname);
        // no "element", the "from" property is provided instead - importer will download the "from" resource as "path"
        results.push({
          path: newPath,
          from: u.toString(),
        });

        // update the link to new path on the target host
        // this is required to be able to follow the links in Word
        // you will need to replace "main--repo--owner" by your project setup
        const newHref = new URL(newPath, 'https://main--stateofnebraska-aem--ociostateofnebraska.hlx.page').toString();
        a.setAttribute('href', newPath);
      }
    });

    return results;
  },
};