/* global WebImporter */
/* eslint-disable no-console */

function buildCheckLicensePage( main, document ) {
	// clear out any existing content
	main.innerHTML = '';

	// h1 heading
	const h1 = document.createElement( 'h1' );
	h1.textContent = 'Check a License';
	main.appendChild( h1 );

	// subheading (bold h2 with yellow underline)
	const subheading = document.createElement( 'h2' );
	subheading.textContent = 'Find more information on the people and firms handling your money.';
	main.appendChild( subheading );
	const yellowUnderline = document.createElement( 'hr' );
	yellowUnderline.style.width = '60px';
	yellowUnderline.style.height = '3px';
	yellowUnderline.style.background = '#f7c948';
	yellowUnderline.style.border = 'none';
	yellowUnderline.style.margin = '0 0 24px 0';
	main.appendChild( yellowUnderline );

	// help text
	const helpText = document.createElement( 'p' );
	helpText.textContent = 'Call NDBF at 402-471-2171 or click on the links below.';
	main.appendChild( helpText );

	// section break
	main.appendChild( document.createElement( 'hr' ) );

	// card grid block (Franklin/Helix table, one row per card)
	const cardGridData = [
		['info-card-grid'],
		[
			'<img src="https://images.unsplash.com/photo-1.jpg" alt="Bank" />', '<a href="#" class="card-link" target="_blank"><strong>Bank</strong></a>'
		],
		[
			'<img src="https://images.unsplash.com/photo-2.jpg" alt="Credit Union" />', '<a href="#" class="card-link" target="_blank"><strong>Credit Union</strong></a>'
		],
		[
			'<img src="https://images.unsplash.com/photo-3.jpg" alt="Money Transmitters" />', '<a href="#" class="card-link" target="_blank"><strong>Money Transmitters</strong></a>'
		],
		[
			'<img src="https://images.unsplash.com/photo-4.jpg" alt="Mortgage Services" />', '<a href="#" class="card-link" target="_blank"><strong>Mortgage Services</strong></a>'
		],
		[
			'<img src="https://images.unsplash.com/photo-5.jpg" alt="Investment Advisors" />', '<a href="#" class="card-link" target="_blank"><strong>Investment Advisors</strong></a>'
		],
		[
			'<img src="https://images.unsplash.com/photo-6.jpg" alt="Broker-Dealers" />', '<a href="#" class="card-link" target="_blank"><strong>Broker-Dealers</strong></a>'
		]
	];
	main.append( WebImporter.DOMUtils.createTable( cardGridData, document ) );

	// section break
	main.appendChild( document.createElement( 'hr' ) );

	// alert (no-icon) block
	const alertData = [
		['alert (no-icon)'],
		['More About Financial Services In Nebraska', '<a href="#">Main Site</a>']
	];
	main.append( WebImporter.DOMUtils.createTable( alertData, document ) );

	// section break
	main.appendChild( document.createElement( 'hr' ) );

	// return to top button/section
	const returnDiv = document.createElement( 'div' );
	const returnBtn = document.createElement( 'a' );
	returnBtn.href = '#';
	returnBtn.textContent = 'Return to top';
	returnDiv.appendChild( returnBtn );
	main.appendChild( returnDiv );

	// section break
	main.appendChild( document.createElement( 'hr' ) );

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
	main.append( WebImporter.DOMUtils.createTable( metaData, document ) );
}

function buildFinfluencerPage( main, document ) {
	main.innerHTML = '';

	// h1 heading
	const h1 = document.createElement( 'h1' );
	h1.textContent = "Financial Advice on Social Media: Rise of the 'Finfluencer'";
	main.appendChild( h1 );

	// hero image
	const heroImg = document.createElement( 'img' );
	heroImg.src = 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2';
	heroImg.alt = 'Person recording with a phone';
	heroImg.setAttribute( 'style', 'max-width:100%;height:auto;' );
	main.appendChild( heroImg );

	// section break
	main.appendChild( document.createElement( 'hr' ) );

	// intro paragraphs
	const intro1 = document.createElement( 'p' );
	intro1.textContent = "With stock market volatility often dominating news headlines, social media's focus on investing has seen a dramatic increase. And many individuals rely social media as their main source for investing information.";
	main.appendChild( intro1 );
	const intro2 = document.createElement( 'p' );
	intro2.textContent = "Influencers have taken notice of this trend. As a result, social media has become more saturated with financial content, leading to the rise of the financial influencer or 'finfluencer.' Viral videos proclaiming that this or that investment opportunity will 'soar to the moon this year' have proliferated. Meanwhile, other social media posts promote easy plans for paying off your house, car, or student loan debt.";
	main.appendChild( intro2 );

	// h2: What is a Financial Influencer ('Finfluencer')?
	const h2_1 = document.createElement( 'h2' );
	h2_1.textContent = "What is a Financial Influencer ('Finfluencer')?";
	main.appendChild( h2_1 );

	// paragraphs for this section
	const para1 = document.createElement( 'p' );
	para1.textContent = "A finfluencer is a person who, by virtue of their popular or cultural status, has the ability to influence the financial decision-making process of others through promotions or recommendations on social media.";
	main.appendChild( para1 );
	const para2 = document.createElement( 'p' );
	para2.textContent = "They may influence potential buyers by publishing posts or videos to their social media accounts, often stylized to be entertaining so that the post or video will be shared with other potential buyers. The financial influencer may be compensated by the business offering the product or service, the platform on which the message appears, or an undisclosed financier.";
	main.appendChild( para2 );
	const para3 = document.createElement( 'p' );
	para3.textContent = "While there is nothing new about marketers paying celebrities to endorse their products, what is different is that such hyper-emotional endorsements are being made in what is otherwise a very regulated industry with stringent rules about performance claims and disclosure of potential conflicts of interest.";
	main.appendChild( para3 );
	const para4 = document.createElement( 'p' );
	para4.textContent = "Remember, investment promoters generally must provide potential investors with all information relevant to making an informed investment decision. Finfluencers are testing the limits of what is considered regulated investment advice and protected free speech.";
	main.appendChild( para4 );
	const para5 = document.createElement( 'p' );
	para5.textContent = "Here's an example: Fiona Finfluencer enters into agreements with several companies to promote – via her Instagram, Facebook, TikTok and Twitter accounts – the company's products and services for cryptocurrency trading accounts, real estate investing, and a start-up company that grows local foods. The cryptocurrency trading platform pays Fiona $25 per person that she pushes to its platform. The real estate investing company compensates Fiona a flat monthly fee. In addition, the food start-up bonus depending on how many people participate in their referral program and on Fiona's recommendations. Fiona receives payments from a monthly flat fee, equity in the company, and free use of its products. Fiona discloses only some of this to her social media followers.";
	main.appendChild( para5 );

	// h2: What to Consider
	const h2_2 = document.createElement( 'h2' );
	h2_2.textContent = 'What to Consider';
	main.appendChild( h2_2 );

	// bulleted list for What to Consider
	const ul1 = document.createElement( 'ul' );
	const li1 = document.createElement( 'li' );
	li1.innerHTML = '<strong>Finfluencers should disclose compensation they receive.</strong> Government laws protect consumers by requiring that advertisements – including product endorsements by social media influencers – must be truthful and disclose all relevant conflicts of interest. But regulators cannot possibly police every advertisement or endorsement. Consumers thus should not assume that a finfluencer is disclosing everything they should.';
	ul1.appendChild( li1 );
	const li2 = document.createElement( 'li' );
	li2.innerHTML = '<strong>Entertainment, not individual advice.</strong> While brokerage firms, banks, and investment advisers work with individual clients, finfluencers try to curate as large a following as possible to achieve a high volume of views. While some finfluencers may work in the financial services industry, many more do not. Finfluencers should, but may not, disclose to their followers that their social media content is not a replacement for individualized financial advice.';
	ul1.appendChild( li2 );
	const li3 = document.createElement( 'li' );
	li3.innerHTML = '<strong>Limited direct recourse.</strong> Finfluencers are not generally required to submit to government regulation. Indeed, a finfluencer\'s speech may be broadly protected by law. As discussed above, some laws and regulations apply to help protect consumers, but investors likely will have limited ability to recover from a finfluencer who turns out to be a fraudster or a know-nothing pretending to be a professional.';
	ul1.appendChild( li3 );
	main.appendChild( ul1 );

	// h2: Red Flags
	const h2_3 = document.createElement( 'h2' );
	h2_3.textContent = 'Red Flags';
	main.appendChild( h2_3 );

	// bulleted list for Red Flags
	const ul2 = document.createElement( 'ul' );
	const li4 = document.createElement( 'li' );
	li4.innerHTML = '<strong>Dubious Advice.</strong> While some financial content may include helpful insights like the basics of financial literacy, other content might include reckless advice (e.g., "Avoid Paying Your Debts" or "Avoid Making Your Next Mortgage Payment Using this HACK!") that could result in serious financial consequences, including a lowered credit score, losing significant amounts of hard-earned money, or civil or criminal actions being brought against you. Similar to investment opportunities, if it sounds too good or too crazy or too reckless to be true, it probably is.';
	ul2.appendChild( li4 );
	const li5 = document.createElement( 'li' );
	li5.innerHTML = '<strong>Credentials Check.</strong> If the finfluencer claims to hold a financial certification or designation of any kind, check if the certification or designation comes from an accredited organization – and if the finfluencer is currently in good standing. You can also check with your state securities regulator to see if the person is registered to provide investment advice and recommendations.';
	ul2.appendChild( li5 );
	const li6 = document.createElement( 'li' );
	li6.innerHTML = '<strong>Show Me the Data.</strong> Some finfluencers build their following by promising "to the moon" stock picks or investment strategies on a regular basis. While these recommendations may increase in value, others may lose value, or strategies may not be quite that good or successful, or strategies that fail. Ask for the data. Remember, finfluencers are making content for their own financial gain. If their strategies and picks worked out so well, is there a reason they are spending hours making social media content?';
	ul2.appendChild( li6 );
	main.appendChild( ul2 );

	// h2: Where to Go for Help
	const h2_4 = document.createElement( 'h2' );
	h2_4.textContent = 'Where to Go for Help';
	main.appendChild( h2_4 );

	// help paragraph
	const helpPara = document.createElement( 'p' );
	helpPara.innerHTML = "If you have concerns about a finfluencer, you should act. You can contact the social media platform through which the finfluencer is spreading their message to make the platform aware of your concerns. Reputable social media platforms have no interest in being conduits for fraud, and the platform may shut down the finfluencer if the platform finds violations of its policies or misconduct by the finfluencer. In addition, you can contact federal and state regulators.<br /><br />Before making any financial decisions, ask questions, do your homework. If you suspect a scam, or are the victim of one, contact the Nebraska Department of Banking and Finance at (402) 471-2171 or via our <a href='#'>online complaint page</a>.";
	main.appendChild( helpPara );

	// alert (no-icon) block
	const alertData = [
		['alert (no-icon)'],
		['More About Financial Services In Nebraska', '<a href="#">Main Site</a>']
	];
	main.append( WebImporter.DOMUtils.createTable( alertData, document ) );

	// metadata block
	const metaData = [
		['metadata'],
		['layout', ''],
		['Title', "Financial Advice on Social Media: Rise of the 'Finfluencer'"],
		['Description', "Financial Advice on Social Media: Rise of the 'Finfluencer'"],
		['image', ''],
		['keywords', ''],
		['tags', '']
	];
	main.append( WebImporter.DOMUtils.createTable( metaData, document ) );
}

function buildProtectYourMoneyPage( main, document ) {
	// clear out any existing content
	main.innerHTML = '';

	// h1 heading
	const h1 = document.createElement( 'h1' );
	h1.textContent = 'Protect Your Money';
	main.appendChild( h1 );

	// section break
	main.appendChild( document.createElement( 'hr' ) );

	// info-card-grid block (Franklin/Helix table, one row per card)
	const cardGridData = [
		['info-card-grid'],
		[
			'<img src="https://images.unsplash.com/photo-1.jpg" alt="AI Fraud" />',
			'<strong>Artificial Intelligence and Investment Fraud</strong><br />A scam artificial intelligence (AI) is everywhere. It\'s easy to access and use, which means scammers use it, too.<br /><p class="usa-button__wrap"><a href="#" class="usa-button usa-button--black" target="_blank">Read More</a></p>'
		],
		[
			'<img src="https://images.unsplash.com/photo-2.jpg" alt="Complaint" />',
			'<strong>How to Report a Scam or Suspicious Investment</strong><br />Feeling uncomfortable about an investment you\'ve been considering? Not sure if you should believe your friend or why they say the opportunity is too good to be missed?<br /><p class="usa-button__wrap"><a href="#" class="usa-button usa-button--black" target="_blank">Read More</a></p>'
		],
		[
			'<img src="https://images.unsplash.com/photo-3.jpg" alt="Financial Scams" />',
			'<strong>Protect Yourself from Financial Scams</strong><br />Taking proactive steps to guard against financial fraud is a good way to prevent the stress that comes with losing money to scams.<br /><p class="usa-button__wrap"><a href="#" class="usa-button usa-button--black" target="_blank">Read More</a></p>'
		]
	];
	main.append( WebImporter.DOMUtils.createTable( cardGridData, document ) );

	// Single accordion block with three sections
	const combinedAccordion = [
		['accordion'],
		[
			'More Alerts and Advisories',
			`<ul>
				<li><a href="#">Protect Yourself from Financial Scams</a></li>
				<li><a href="#">Other Tips to Avoid Financial Fraud</a></li>
				<li><a href="#">Recognizing Common Financial Scams</a></li>
				<li><a href="#">Relationship Scams: Are Big Red-flagging Suspicious?</a></li>
				<li><a href="#">Sweepstakes Scams</a></li>
				<li><a href="#">Major Red Scams</a></li>
				<li><a href="#">Phishing</a></li>
				<li><a href="#">Marijuana Investment Scams</a></li>
				<li><a href="#">Social Media/Internet Scams</a></li>
				<li><a href="#">Artificial Intelligence and Investment Fraud</a></li>
				<li><a href="#">How to Report a Scam or Suspicious Investment</a></li>
			</ul>`
		],
		[
			'Other Resources',
			`<ul>
				<li><strong>Videos</strong>
					<ul>
						<li><a href="#">NDBF Interview With News Team - More, More, More</a></li>
						<li><a href="#">NDBF Interview With News Team - Make Cents Make Sense</a></li>
					</ul>
				</li>
				<li><strong>Other Nebraska Resources</strong>
					<ul>
						<li><a href="#">Nebraska Insurance Guaranty, Deposit the Good Life</a></li>
					</ul>
				</li>
				<li><strong>Federal and National Resources</strong>
					<ul>
						<li><a href="#">NDBF Fraud Quiz</a></li>
						<li><a href="#">FTC Consumer Alert and Advice</a></li>
						<li><a href="#">CFPB Fraud Quiz</a></li>
						<li><a href="#">FINRA Scam Meter</a></li>
						<li><a href="#">CFPB's Resource Guide and Section</a></li>
					</ul>
				</li>
				<li><strong>For Kids</strong>
					<ul>
						<li><a href="#">FTC's Website</a></li>
					</ul>
				</li>
				<li><strong>For Older Adults</strong>
					<ul>
						<li><a href="#">TSA's Pass It On!</a></li>
					</ul>
				</li>
			</ul>`
		],
		[
			'Printable Assets',
			`<div>
				<img src="https://images.unsplash.com/photo-4.jpg" alt="Investment Fraud" style="max-width:200px;" /><br />
				<img src="https://images.unsplash.com/photo-5.jpg" alt="Fraude de Inversión" style="max-width:200px;" /><br />
				<strong>Other Assets:</strong>
				<ul>
					<li><a href="#">10 Tips to Avoid Investment Fraud</a></li>
					<li><a href="#">Big Red-flagging Scams</a></li>
					<li><a href="#">Where Not to Take Scam Scammed Online</a></li>
					<li><a href="#">How Scammers Take Your Money</a></li>
					<li><a href="#">Potential Signs of Senior Financial Exploitation</a></li>
					<li><a href="#">Investment-Related Fraud in Nebraska</a></li>
					<li><a href="#">Investment Fraud Awareness Quiz</a></li>
					<li><a href="#">Nebraska Cryptocurrency Kiosk/ATM Oversight Law (Takes Effect September 2024)</a></li>
				</ul>
			</div>`
		]
	];
	main.append( WebImporter.DOMUtils.createTable( combinedAccordion, document ) );

	// alert (no-icon) block
	const alertData = [
		['alert (no-icon)'],
		['More About Financial Services In Nebraska', '<a href="#">Main Site</a>']
	];
	main.append( WebImporter.DOMUtils.createTable( alertData, document ) );

	// metadata block
	const metaData = [
		['metadata'],
		['layout', ''],
		['Title', 'Title of The Page'],
		['Description', 'Description of the page'],
		['image', ''],
		['keywords', ''],
		['tags', '']
	];
	main.append( WebImporter.DOMUtils.createTable( metaData, document ) );
}

function buildAboutInitiativePage( main, document ) {
	main.innerHTML = '';

	// h1 heading
	const h1 = document.createElement( 'h1' );
	h1.textContent = 'About This Initiative';
	main.appendChild( h1 );

	// hero image
	const heroImg = document.createElement( 'img' );
	heroImg.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'; // placeholder
	heroImg.alt = 'Open road and sky';
	heroImg.setAttribute( 'style', 'max-width:100%;height:auto;' );
	main.appendChild( heroImg );

	// section break
	main.appendChild( document.createElement( 'hr' ) );

	// mission statement as h2
	const missionH2 = document.createElement( 'h2' );
	missionH2.textContent = 'The mission of Nebraska Department of Banking and Finance (NDBF) is to protect and maintain the public confidence through fair, efficient, and experienced supervision of the state-regulated financial services industry.';
	main.appendChild( missionH2 );

	// rest of intro paragraphs
	const introParas = [
		'As part of that mission, NDBF assists the public in their dealings with those industries.',
		'The financial well-being of Nebraskans is a priority of NDBF. Financial fitness is about is empowering families and individuals – whether it\'s buying a car or home, paying for education, or saving for retirement. Saving and investing money wisely allows for future financial freedom.',
		'A lack of financial knowledge can derail you from your financial goals due to overspending, unsustainable debt, poor credit, bankruptcy, or foreclosure.',
		'NDBF developed the "Make Cents Make Sense" initiative to provide trusted, easy-to-find information to help you with your financial journey and guard against financial fraud. On this site, you will find many useful resources, including insights on how to check the license of a financial services professional or file a complaint.',
		'Learn more about "Make Cents Make Sense" by watching this <a href="#">10/11 News interview</a>.',
		'When it comes to financial wellness, knowledge is power. It\'s never too early – or too late – to improve your relationship with money and enhance your financial future.'
	];
	introParas.forEach( text => {
		const p = document.createElement( 'p' );
		p.innerHTML = text;
		main.appendChild( p );
	} );

	// accordion block for Engagement with Jacht
	const accordionData = [
		['accordion'],
		[
			'Engagement with Jacht',
			'To develop the Make Cents Make Sense financial wellness initiative, NDBF engaged the services of <a href="#">Jacht</a>, a student-run ad agency at the University of Nebraska-Lincoln. Jacht\'s activities included conducting market research, developing key messaging strategies, and creating website design and other creative content.<br /><br />Jacht <a href="#">received</a> the Paper Anvil Award of Merit from the Nebraska\'s Public Relations Society of America chapter for its efforts on the Make Cents Make Sense initiative.'
		]
	];
	main.append( WebImporter.DOMUtils.createTable( accordionData, document ) );

	// alert (no-icon) block
	const alertData = [
		['alert (no-icon)'],
		['More About Financial Services In Nebraska', '<a href="#">Main Site</a>']
	];
	main.append( WebImporter.DOMUtils.createTable( alertData, document ) );

	// return to top button/section
	const returnDiv = document.createElement( 'div' );
	const returnBtn = document.createElement( 'a' );
	returnBtn.href = '#';
	returnBtn.textContent = 'Return to top';
	returnDiv.appendChild( returnBtn );
	main.appendChild( returnDiv );

	// section break
	main.appendChild( document.createElement( 'hr' ) );

	// metadata block
	const metaData = [
		['metadata'],
		['layout', ''],
		['Title', 'About This Initiative'],
		['Description', 'About This Initiative'],
		['image', ''],
		['keywords', ''],
		['tags', '']
	];
	main.append( WebImporter.DOMUtils.createTable( metaData, document ) );
}

function buildMainPage( main, document ) {
	main.innerHTML = '';

	// Use hero-homepage block instead of hero to avoid conflicts
	const heroBlock = [
		['hero-homepage'],
		[
			`<h1>Make Cents Make Sense</h1>
			 <p>
				 <a href="/about-this-initiative" class="usa-button usa-button--yellow" target="_blank">
					 About this Initiative <span aria-hidden="true">&#8599;</span>
				 </a>
			 </p>
			 <img src="https://images.unsplash.com/photo-1606761568499-6c0c1b1b1b1b" alt="Coins and bills" style="max-width:100%;height:auto;" />`
		]
	];
	main.append( WebImporter.DOMUtils.createTable( heroBlock, document ) );

	// Only one section break after hero
	main.appendChild( document.createElement( 'hr' ) );

	// columns block
	const columnsData = [
		['columns'],
		[
			'<strong>Be a Smart Saver and Investor</strong><br /><span>Save and grow your money:</span><ul>' +
			'<li>&#10003; Create a budget</li>' +
			'<li>&#10003; Leverage the power of compound interest</li>' +
			'<li>&#10003; Make an investment plan</li>' +
			'<li>&#10003; Learn about investment products</li>' +
			'</ul><p><a href="#" class="usa-button usa-button--primary" target="_blank">Get Started</a></p>',
			'<strong>Be a Fraud Fighter</strong><br /><span>Protect your money and investments:</span><ul>' +
			'<li>&#10003; Spot signs of frauds and scams</li>' +
			'<li>&#10003; Understand how scams work</li>' +
			'<li>&#10003; Know what questions to ask</li>' +
			'<li>&#10003; What to do if you are a victim of a scam</li>' +
			'</ul><p><a href="#" class="usa-button usa-button--primary" target="_blank">Protect Your Money</a></p>'
		]
	];
	main.append( WebImporter.DOMUtils.createTable( columnsData, document ) );

	// section break
	main.appendChild( document.createElement( 'hr' ) );

	// I want to: section with yellow underline
	const iWantDiv = document.createElement( 'div' );
	const iWantTitle = document.createElement( 'h2' );
	iWantTitle.textContent = 'I want to:';
	iWantDiv.appendChild( iWantTitle );
	const iWantUnderline = document.createElement( 'hr' );
	iWantUnderline.setAttribute( 'style', 'width: 60px; height: 3px; background: #f7c948; border: none; margin: 0 0 24px 0;' );
	iWantDiv.appendChild( iWantUnderline );
	main.appendChild( iWantDiv );

	// icon-button-grid block
	const iconButtonGridData = [
		['icon-button-grid'],
		['search', '<a href="/check-a-license">Check a License</a>'],
		['announcement', '<a href="/file-a-complaint">File a Complaint</a>'],
		['arrow_upward', '<a href="https://ndbf.nebraska.gov/">Visit the Main NDBF Site</a>']
	];
	main.append( WebImporter.DOMUtils.createTable( iconButtonGridData, document ) );

	// section break
	main.appendChild( document.createElement( 'hr' ) );

	// Recent News section with yellow underline
	const newsDiv = document.createElement( 'div' );
	const newsTitle = document.createElement( 'h2' );
	newsTitle.textContent = 'Recent News';
	newsDiv.appendChild( newsTitle );
	const newsUnderline = document.createElement( 'hr' );
	newsUnderline.setAttribute( 'style', 'width: 60px; height: 3px; background: #f7c948; border: none; margin: 0 0 24px 0;' );
	newsDiv.appendChild( newsUnderline );
	main.appendChild( newsDiv );

	// search (dynamic-collection) block for news
	const searchData = [
		['search (dynamic-collection)'],
		['https://main--stateofnebraska-aem--ocistateofnebraska.aem.live/search-index.json'],
		['show-search-box', 'no', 'Option to show the search box'],
		['show-pagination', 'no', 'Option to show Pagination'],
		['sort-key', 'lastModified', 'Option sort results by one of the following keys: - lastModified - publicationDate - relevance'],
		['filter-by', 'notice', 'option to pre-filter the results by a page tag set within the metadata of the displayed page']
	];
	main.append( WebImporter.DOMUtils.createTable( searchData, document ) );

	// return to top button
	const returnDiv = document.createElement( 'div' );
	const returnBtn = document.createElement( 'a' );
	returnBtn.href = '#';
	returnBtn.textContent = 'Return to top';
	returnDiv.appendChild( returnBtn );
	main.appendChild( returnDiv );

	// section break
	main.appendChild( document.createElement( 'hr' ) );

	// metadata block
	const metaData = [
		['metadata'],
		['template', 'homepage']
	];
	main.append( WebImporter.DOMUtils.createTable( metaData, document ) );
}

export default {
	transform: ( { document } ) => {
		const main1 = document.createElement( 'main' );
		buildCheckLicensePage( main1, document );
		const main2 = document.createElement( 'main' );
		buildFinfluencerPage( main2, document );
		const main3 = document.createElement( 'main' );
		buildProtectYourMoneyPage( main3, document );
		const main4 = document.createElement( 'main' );
		buildAboutInitiativePage( main4, document );
		const main5 = document.createElement( 'main' );
		buildMainPage( main5, document );
		return [
			{ element: main1, path: '/check-a-license' },
			{ element: main2, path: '/finfluencer' },
			{ element: main3, path: '/protect-your-money' },
			{ element: main4, path: '/about-this-initiative' },
			{ element: main5, path: '/' }
		];
	}
};
