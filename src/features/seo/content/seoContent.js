export const SEO_HUB_PATH = '/landingpage';
export const SEO_BLOG_PATH = `${SEO_HUB_PATH}/blog`;

export function getBlogPostPath(slug) {
  return `${SEO_BLOG_PATH}/${slug}`;
}

export const SEO_KEYWORD_ROWS = [
  {
    category: 'High volume',
    keyword: 'precio bitcoin hoy',
    language: 'ES',
    intent: 'Informational',
    pageLabel: 'Root dashboard',
    pagePath: '/',
  },
  {
    category: 'High volume',
    keyword: 'precio de bitcoin en tiempo real',
    language: 'ES',
    intent: 'Informational',
    pageLabel: 'Root dashboard',
    pagePath: '/',
  },
  {
    category: 'High volume',
    keyword: 'cuantos nodos tiene bitcoin',
    language: 'ES',
    intent: 'Informational',
    pageLabel: 'Bitcoin nodes map module',
    pagePath: '/module/s06-bitcoin-nodes-world-map',
  },
  {
    category: 'High volume',
    keyword: 'bitcoin price today',
    language: 'EN',
    intent: 'Informational',
    pageLabel: 'Root dashboard',
    pagePath: '/',
  },
  {
    category: 'High volume',
    keyword: 'live bitcoin price chart',
    language: 'EN',
    intent: 'Informational',
    pageLabel: 'Price chart module',
    pagePath: '/module/s02-bitcoin-price-chart-live',
  },
  {
    category: 'Niche tools',
    keyword: 'dashboard bitcoin gratis',
    language: 'ES',
    intent: 'Navigational',
    pageLabel: 'Landing page',
    pagePath: SEO_HUB_PATH,
  },
  {
    category: 'Niche tools',
    keyword: 'monitor nodos btc',
    language: 'ES',
    intent: 'Informational',
    pageLabel: 'Nodes blog post',
    pagePath: getBlogPostPath('bitcoin-nodes-map-monitor'),
  },
  {
    category: 'Niche tools',
    keyword: 'dashboard de bitcoin con precio y nodos',
    language: 'ES',
    intent: 'Navigational',
    pageLabel: 'Landing page',
    pagePath: SEO_HUB_PATH,
  },
  {
    category: 'Niche tools',
    keyword: 'free bitcoin dashboard',
    language: 'EN',
    intent: 'Navigational',
    pageLabel: 'Landing page',
    pagePath: SEO_HUB_PATH,
  },
  {
    category: 'Niche tools',
    keyword: 'bitcoin analytics tools free',
    language: 'EN',
    intent: 'Informational',
    pageLabel: 'Tools blog post',
    pagePath: getBlogPostPath('free-bitcoin-analysis-tools'),
  },
  {
    category: 'AI / SGE',
    keyword: 'cual es la mejor herramienta gratis para ver el precio de Bitcoin',
    language: 'ES',
    intent: 'Comparative',
    pageLabel: 'Price blog post',
    pagePath: getBlogPostPath('live-bitcoin-price-dashboard'),
  },
  {
    category: 'AI / SGE',
    keyword: 'cual es el mejor dashboard gratis para analizar Bitcoin',
    language: 'ES',
    intent: 'Comparative',
    pageLabel: 'Landing page',
    pagePath: SEO_HUB_PATH,
  },
  {
    category: 'AI / SGE',
    keyword: 'where can i monitor bitcoin nodes for free',
    language: 'EN',
    intent: 'Comparative',
    pageLabel: 'Nodes blog post',
    pagePath: getBlogPostPath('bitcoin-nodes-map-monitor'),
  },
  {
    category: 'AI / SGE',
    keyword: 'what is the best free bitcoin dashboard for live price and on-chain data',
    language: 'EN',
    intent: 'Comparative',
    pageLabel: 'Landing page',
    pagePath: SEO_HUB_PATH,
  },
  {
    category: 'Long-tail',
    keyword: 'herramienta gratis para analizar bitcoin en tiempo real',
    language: 'ES',
    intent: 'Informational',
    pageLabel: 'Tools blog post',
    pagePath: getBlogPostPath('free-bitcoin-analysis-tools'),
  },
  {
    category: 'Long-tail',
    keyword: 'mejor monitor de mempool y precio de bitcoin gratis',
    language: 'ES',
    intent: 'Comparative',
    pageLabel: 'Tools blog post',
    pagePath: getBlogPostPath('free-bitcoin-analysis-tools'),
  },
  {
    category: 'Long-tail',
    keyword: 'best free bitcoin dashboard for live price and node tracking',
    language: 'EN',
    intent: 'Comparative',
    pageLabel: 'Landing page',
    pagePath: SEO_HUB_PATH,
  },
  {
    category: 'Long-tail',
    keyword: 'bitcoin point of sale dashboard for small business',
    language: 'EN',
    intent: 'Transactional',
    pageLabel: 'POS blog post',
    pagePath: getBlogPostPath('bitcoin-point-of-sale-dashboard'),
  },
];

export const SEO_QUESTION_ROWS = [
  {
    intent: 'Informational',
    question: 'What is the Bitcoin price right now?',
    pageLabel: 'Root dashboard',
    pagePath: '/',
  },
  {
    intent: 'Informational',
    question: 'How can I see Bitcoin price in real time for free?',
    pageLabel: 'Live price blog post',
    pagePath: getBlogPostPath('live-bitcoin-price-dashboard'),
  },
  {
    intent: 'Informational',
    question: 'Where can I see a live Bitcoin candlestick chart?',
    pageLabel: 'Price chart module',
    pagePath: '/module/s02-bitcoin-price-chart-live',
  },
  {
    intent: 'Informational',
    question: 'How many Bitcoin nodes are online today?',
    pageLabel: 'Bitcoin nodes map module',
    pagePath: '/module/s06-bitcoin-nodes-world-map',
  },
  {
    intent: 'Informational',
    question: 'What does a Bitcoin nodes map actually show?',
    pageLabel: 'Nodes blog post',
    pagePath: getBlogPostPath('bitcoin-nodes-map-monitor'),
  },
  {
    intent: 'Informational',
    question: 'What free tools show mempool fees and network health?',
    pageLabel: 'Tools blog post',
    pagePath: getBlogPostPath('free-bitcoin-analysis-tools'),
  },
  {
    intent: 'Comparative',
    question: 'What is the best free Bitcoin dashboard?',
    pageLabel: 'Landing page',
    pagePath: SEO_HUB_PATH,
  },
  {
    intent: 'Comparative',
    question: 'Which is better for Bitcoin tracking: an exchange app or a dedicated dashboard?',
    pageLabel: 'Live price blog post',
    pagePath: getBlogPostPath('live-bitcoin-price-dashboard'),
  },
  {
    intent: 'Comparative',
    question: 'What is the best free tool to monitor Bitcoin nodes?',
    pageLabel: 'Nodes blog post',
    pagePath: getBlogPostPath('bitcoin-nodes-map-monitor'),
  },
  {
    intent: 'Comparative',
    question: 'Which dashboard combines Bitcoin price, mempool, on-chain data, and merchants?',
    pageLabel: 'Landing page',
    pagePath: SEO_HUB_PATH,
  },
  {
    intent: 'Comparative',
    question: 'Is there a strong free alternative to paid crypto terminals for Bitcoin-only analysis?',
    pageLabel: 'Tools blog post',
    pagePath: getBlogPostPath('free-bitcoin-analysis-tools'),
  },
  {
    intent: 'Transactional',
    question: 'How do I accept Bitcoin payments at a physical store?',
    pageLabel: 'POS blog post',
    pagePath: getBlogPostPath('bitcoin-point-of-sale-dashboard'),
  },
  {
    intent: 'Transactional',
    question: 'What is the best Bitcoin point-of-sale setup for a cafe or shop?',
    pageLabel: 'POS blog post',
    pagePath: getBlogPostPath('bitcoin-point-of-sale-dashboard'),
  },
  {
    intent: 'Transactional',
    question: 'What should I monitor before accepting Bitcoin at checkout?',
    pageLabel: 'POS blog post',
    pagePath: getBlogPostPath('bitcoin-point-of-sale-dashboard'),
  },
  {
    intent: 'Transactional',
    question: 'Where can I find a free Bitcoin merchant dashboard or business map?',
    pageLabel: 'Merchant map module',
    pagePath: '/module/s08-bitcoin-merchant-map',
  },
];

export const SEO_HUB_FAQS = [
  {
    question: 'What is Satoshi Dashboard?',
    answer: 'Satoshi Dashboard is a free Bitcoin dashboard that brings together live BTC price, mempool data, full-node maps, merchant maps, Lightning metrics, and long-term market models in one place.',
  },
  {
    question: 'Is this Bitcoin dashboard free to use?',
    answer: 'Yes. The dashboard is free to access and designed to answer high-intent Bitcoin research queries without putting the core tools behind a paywall.',
  },
  {
    question: 'Can I track Bitcoin price in real time here?',
    answer: 'Yes. The root dashboard and the dedicated price modules let users monitor live Bitcoin price, market context, and supporting indicators from one interface.',
  },
  {
    question: 'Does the site show how many Bitcoin nodes are online?',
    answer: 'Yes. The Bitcoin nodes map module is built to answer node-count and geographic distribution questions for users researching decentralization.',
  },
  {
    question: 'Can I find Bitcoin-friendly businesses on this site?',
    answer: 'Yes. The merchant map module highlights Bitcoin-friendly businesses by country and supports adoption research, merchant discovery, and point-of-sale use cases.',
  },
  {
    question: 'Is the content optimized for AI search and featured snippets?',
    answer: 'Yes. The landing page and blog use direct question-and-answer formatting, structured data, natural headings, and clear internal links to support Google and AI answer engines.',
  },
  {
    question: 'Which pages should I visit first if I only care about live price and fees?',
    answer: 'Start with the root dashboard, then open the live Bitcoin price chart and mempool fee gauge modules for a tighter monitoring workflow.',
  },
  {
    question: 'Can a small business use this as a Bitcoin point-of-sale research tool?',
    answer: 'Yes. The merchant map, Lightning stats, live price tools, and the dedicated point-of-sale article give operators a lightweight research stack before they accept BTC.',
  },
];

export const BLOG_POSTS = [
  {
    slug: 'live-bitcoin-price-dashboard',
    title: 'Best Free Bitcoin Dashboard for Live BTC Price and Market Data',
    metaTitle: 'Live Bitcoin Price Dashboard | Free BTC Price Tracker',
    metaDescription: 'Learn what to watch beyond the BTC price headline and how a free Bitcoin dashboard can combine live price, chart, mempool, and sentiment in one workflow.',
    excerpt: 'A practical guide to live Bitcoin price tracking for users who want more than a simple exchange ticker.',
    publishedDate: '2026-03-08',
    readTime: '6 min read',
    keywords: ['live bitcoin price dashboard', 'free bitcoin price tracker', 'btc market dashboard'],
    relatedModuleCodes: ['S01', 'S02', 'S04', 'S11'],
    intro: [
      'Most people start by checking a Bitcoin price widget or an exchange app, but that habit leaves out the context that explains why the price is moving. A better workflow combines live Bitcoin price, market breadth, mempool pressure, and sentiment in the same view.',
      'That is why a dedicated Bitcoin dashboard is more useful than a single ticker. When the dashboard shows price, chart structure, fee pressure, and a fast sentiment read together, users can answer the questions that usually trigger a second and third search.',
    ],
    snippetTitle: 'Featured snippet answer',
    snippetText: 'The best free Bitcoin dashboard for live BTC price is one that combines the current price, a clean chart, mempool fees, and a market context layer such as sentiment or network health. That reduces tab switching and helps users interpret the move instead of reacting only to the number.',
    sections: [
      {
        heading: 'Why a live Bitcoin dashboard beats checking only an exchange app',
        paragraphs: [
          'A live exchange screen is good at showing the latest trade, but it is weak at explaining whether a move is broad, stressed, or supported by network activity. A dashboard adds the supporting signals that answer the next user question before it has to be searched separately.',
          'For SEO and AI-driven discovery, that matters because real users phrase questions conversationally. They ask where to see Bitcoin price in real time, but they also ask what fees are doing, whether sentiment is overheating, and whether the move is local or global. A dashboard that answers those related questions wins longer sessions and stronger relevance.',
        ],
        bullets: [
          'Live BTC price for immediate market awareness',
          'Candlestick structure for short and medium timeframes',
          'Mempool fees for transaction pressure and urgency',
          'Fear & Greed for quick sentiment context',
        ],
      },
      {
        heading: 'What to watch besides the BTC/USD headline price',
        paragraphs: [
          'If the price spikes but mempool pressure stays calm, the move may be speculative and easier to fade. If price rises while network pressure and broader participation also rise, the move often has better structural support. That is why price alone is incomplete.',
        ],
        subheading: 'The minimum market checklist',
        subparagraphs: [
          'Watch the root dashboard for the headline read, open the price chart for structure, and use the mempool module when you need to understand transaction urgency. Then layer in Fear & Greed to avoid reading short-term momentum in isolation.',
        ],
        bullets: [
          'Price level and direction',
          'Chart time horizon and volatility',
          'Current fee environment',
          'Sentiment temperature',
        ],
      },
      {
        heading: 'How Satoshi Dashboard turns this into a simple workflow',
        paragraphs: [
          'The root dashboard is the fastest starting point because it answers the broad question first: what is happening to Bitcoin right now? From there, users can move directly into the chart, fee gauge, or sentiment pages without losing the analytical thread.',
          'That same structure is useful for organic search. A landing page can attract the query, the article can answer the comparison question, and the module can satisfy the action the user really wanted: a live tool.',
        ],
      },
    ],
    faq: [
      {
        question: 'What should a live Bitcoin price dashboard include?',
        answer: 'At a minimum it should include current price, a live chart, a fee or mempool view, and one context metric such as Fear & Greed or node activity.',
      },
      {
        question: 'Is a dashboard better than an exchange app for BTC tracking?',
        answer: 'For research, yes. Exchange apps are good for order execution, but dashboards are better for market context and decision support.',
      },
      {
        question: 'Where should a user go after reading this article?',
        answer: 'Start with the root dashboard for the live headline view, then open the chart and mempool modules for deeper monitoring.',
      },
    ],
  },
  {
    slug: 'bitcoin-nodes-map-monitor',
    title: 'How to Track Bitcoin Nodes With a Free Nodes Map and Monitor',
    metaTitle: 'Bitcoin Nodes Map Monitor | Track Full Nodes for Free',
    metaDescription: 'Understand what a Bitcoin nodes map shows, why node count matters, and how to monitor full-node distribution with a free BTC dashboard.',
    excerpt: 'A clear explanation of Bitcoin full-node maps, node count research, and what decentralization signals users should actually watch.',
    publishedDate: '2026-03-08',
    readTime: '6 min read',
    keywords: ['bitcoin nodes map monitor', 'full nodes tracker', 'how many bitcoin nodes'],
    relatedModuleCodes: ['S06', 'S07', 'S08'],
    intro: [
      'Search demand for Bitcoin nodes usually starts with a simple number question: how many nodes does Bitcoin have? The real answer is more useful when it includes geography, trend direction, and the difference between reachable nodes and total participants.',
      'A good Bitcoin nodes monitor turns that raw count into context. It helps users see where reachable full nodes cluster, where decentralization is stronger or weaker, and how infrastructure compares with Lightning or merchant adoption.',
    ],
    snippetTitle: 'Featured snippet answer',
    snippetText: 'A Bitcoin nodes map shows the geographic distribution of reachable full nodes. It helps users measure decentralization, infrastructure density, and where the network is strongest across countries and regions.',
    sections: [
      {
        heading: 'Why node count matters for Bitcoin research',
        paragraphs: [
          'Node count is not just a vanity metric. It points to the resilience of the network, the spread of infrastructure, and the ability of different regions to validate Bitcoin independently. When people ask how many Bitcoin nodes exist, they are often really asking whether the network is healthy and decentralized.',
          'That makes node pages strong SEO assets because the informational query has clear follow-up intent. Users want the count, but then they want the map, the country split, and the explanation of what the number means.',
        ],
      },
      {
        heading: 'What a nodes map tells you that a raw number cannot',
        paragraphs: [
          'A map reveals concentration. Two countries can have the same total count change while the global decentralization picture moves in opposite directions. Geography gives the raw total meaning.',
        ],
        bullets: [
          'Which countries host the highest concentration of reachable nodes',
          'Whether node distribution is broad or concentrated',
          'How infrastructure compares across regions',
          'Where Bitcoin and Lightning presence overlap or diverge',
        ],
      },
      {
        heading: 'How to combine node research with Lightning and merchant adoption',
        paragraphs: [
          'Node research becomes more useful when it is paired with Lightning node visibility and merchant density. That combination tells a fuller story: validation, payments infrastructure, and real-world usage. It also creates strong internal linking between closely related user intents.',
          'For a user coming from search, the best flow is simple: start with the full-node map, compare it with Lightning nodes, and then review merchant density by country. That sequence answers three connected questions without leaving the site.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does a Bitcoin nodes map show every node on Earth?',
        answer: 'No. Most public maps focus on reachable nodes, which are still useful for decentralization research but do not represent every private node.',
      },
      {
        question: 'Why do users search for Bitcoin nodes by country?',
        answer: 'Country-level views help people understand geographic concentration, censorship risk, and where infrastructure is most mature.',
      },
      {
        question: 'What should I compare with the node map?',
        answer: 'Compare it with Lightning node distribution and the merchant map to connect infrastructure with payment and adoption signals.',
      },
    ],
  },
  {
    slug: 'free-bitcoin-analysis-tools',
    title: 'Free Bitcoin Analysis Tools: Dashboard, Mempool, Sentiment and On-Chain Metrics',
    metaTitle: 'Free Bitcoin Analysis Tools | Dashboard, Mempool and On-Chain',
    metaDescription: 'A practical stack of free Bitcoin analysis tools covering live price, mempool, nodes, sentiment, Lightning, and on-chain metrics in one workflow.',
    excerpt: 'A guide for users who want a lean BTC research stack without paying for a general crypto terminal.',
    publishedDate: '2026-03-08',
    readTime: '7 min read',
    keywords: ['free bitcoin analysis tools', 'bitcoin dashboard tools', 'btc analysis workflow'],
    relatedModuleCodes: ['S01', 'S04', 'S06', 'S09', 'S11', 'S26'],
    intro: [
      'Most Bitcoin users do not need a massive institutional terminal. They need a compact stack of free Bitcoin analysis tools that covers price, fees, nodes, sentiment, and a few long-term market models. The best stack is not the one with the most screens; it is the one that answers the next question fast.',
      'That is where a single Bitcoin dashboard becomes valuable. Instead of bouncing across price sites, fee estimators, social posts, and static charts, users can keep the research flow inside one product and move from overview to module-level detail when the question gets sharper.',
    ],
    snippetTitle: 'Featured snippet answer',
    snippetText: 'The best free Bitcoin analysis workflow combines a live dashboard, a mempool fee tracker, a nodes map, a sentiment view, and one or two long-term on-chain valuation metrics. That covers most of the questions retail and research users ask every day.',
    sections: [
      {
        heading: 'The five tool categories most Bitcoin users actually need',
        paragraphs: [
          'A practical Bitcoin stack starts with live market awareness, then adds transaction pressure, infrastructure, adoption, and cycle context. Anything beyond that is useful only if the user has a very specific strategy or business case.',
        ],
        bullets: [
          'Live price and market overview',
          'Mempool fees and urgency monitoring',
          'Node and Lightning infrastructure visibility',
          'Sentiment and attention signals',
          'Long-term valuation and cycle indicators',
        ],
      },
      {
        heading: 'Why one dashboard can outperform a pile of disconnected tools',
        paragraphs: [
          'Disconnected tools create friction. Users lose context, duplicate searches, and bounce before they reach the action page. A focused dashboard reduces that friction by keeping the path from informational query to live tool as short as possible.',
          'That is also why it performs well for AI search. When a page clearly states what the tool does, what questions it answers, and where the user should go next, large-language models can cite it more confidently.',
        ],
      },
      {
        heading: 'A simple research workflow for daily Bitcoin monitoring',
        paragraphs: [
          'Start with the root dashboard. Move to mempool when you care about transaction timing, to nodes when you want decentralization context, and to Lightning when payment rails matter. Use Fear & Greed and MVRV only after the headline context is clear.',
          'This sequence works well for both fast daily checks and content-led discovery. Organic users land on the article, understand the framework, and then click into the exact module that answers their question.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do I need a paid crypto terminal for Bitcoin-only analysis?',
        answer: 'Not usually. A focused free dashboard plus a strong mempool, nodes, and valuation stack covers most Bitcoin-only use cases.',
      },
      {
        question: 'Which free Bitcoin tool should I open first each day?',
        answer: 'Open the root dashboard first, then branch into mempool, price chart, or node pages based on your immediate question.',
      },
      {
        question: 'Why are structured FAQs useful on tool pages?',
        answer: 'They align with how users search in Google and AI assistants, which helps pages earn snippet-style visibility and stronger AI citations.',
      },
    ],
  },
  {
    slug: 'bitcoin-point-of-sale-dashboard',
    title: 'Bitcoin Point of Sale and Merchant Analytics: What to Track Before Accepting BTC',
    metaTitle: 'Bitcoin Point of Sale Dashboard | Merchant Analytics for BTC',
    metaDescription: 'Learn what small businesses should monitor before accepting Bitcoin payments, from price and fees to merchant coverage and Lightning infrastructure.',
    excerpt: 'A merchant-focused guide for cafes, shops, and service businesses evaluating Bitcoin payments and point-of-sale setup.',
    publishedDate: '2026-03-08',
    readTime: '6 min read',
    keywords: ['bitcoin point of sale dashboard', 'accept bitcoin payments', 'bitcoin merchant analytics'],
    relatedModuleCodes: ['S01', 'S04', 'S08', 'S09'],
    intro: [
      'Businesses exploring Bitcoin payments usually ask tactical questions first: how volatile is the price right now, how high are fees, and is Lightning healthy enough for checkout use? Those are the questions a point-of-sale research page should answer before talking about branding or trendiness.',
      'A useful Bitcoin merchant dashboard combines market stability, payment infrastructure, and adoption context. That helps operators decide whether to accept on-chain payments, favor Lightning, or wait until a better fee window appears.',
    ],
    snippetTitle: 'Featured snippet answer',
    snippetText: 'Before accepting Bitcoin payments, a small business should monitor live BTC price, current mempool fees, Lightning Network capacity, and local or regional merchant adoption. Those four signals cover volatility, settlement cost, payment usability, and real-world demand.',
    sections: [
      {
        heading: 'What merchants should watch before they put up a Bitcoin accepted sign',
        paragraphs: [
          'The goal is not perfect forecasting. It is operational awareness. If fees are spiking, on-chain checkout may be a poor customer experience. If Lightning infrastructure is healthy, small-ticket payments become more practical. If price is extremely volatile, staff training and conversion policy matter even more.',
        ],
        bullets: [
          'Live BTC price and short-term volatility',
          'Current mempool fee pressure',
          'Lightning capacity and node availability',
          'Local merchant density and adoption cues',
        ],
      },
      {
        heading: 'Why the merchant map matters for point-of-sale planning',
        paragraphs: [
          'A merchant map does more than help users find a store. It also shows whether Bitcoin acceptance is isolated or growing in a region. That context is useful for businesses deciding how much customer education they will need.',
          'For content strategy, merchant pages capture both discovery intent and business intent. They speak to users who want to spend Bitcoin and to operators who want to evaluate whether adoption in their area is meaningful.',
        ],
      },
      {
        heading: 'A lightweight workflow for small business operators',
        paragraphs: [
          'Check the root dashboard for general market conditions, open the mempool gauge before offering on-chain settlement, and review Lightning stats if your business depends on fast low-value checkout. Then use the merchant map as a real-world adoption reference point.',
          'That workflow is simple enough for non-technical teams and strong enough for SEO because it turns abstract Bitcoin payment questions into an actionable sequence of pages.',
        ],
      },
    ],
    faq: [
      {
        question: 'Should a small shop use on-chain Bitcoin or Lightning?',
        answer: 'For smaller, faster payments, Lightning is usually more practical because it reduces fee friction and checkout delay.',
      },
      {
        question: 'Why should merchants monitor mempool fees?',
        answer: 'Mempool pressure affects settlement cost and customer experience, especially for on-chain payments and time-sensitive transactions.',
      },
      {
        question: 'What page should a merchant visit first?',
        answer: 'Start with the root dashboard for market context, then use the mempool, Lightning, and merchant map pages for payment-specific research.',
      },
    ],
  },
];

export const BLOG_POSTS_BY_SLUG = Object.fromEntries(BLOG_POSTS.map((post) => [post.slug, post]));

export function getBlogPostBySlug(slug) {
  return BLOG_POSTS_BY_SLUG[slug] || null;
}
