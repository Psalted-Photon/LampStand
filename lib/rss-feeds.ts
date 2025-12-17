// RSS Feed sources for each category
export const RSS_FEEDS = {
  israel: [
    'https://www.timesofisrael.com/feed/',
    'https://www.jpost.com/rss/rssfeedsheadlines.aspx',
  ],
  international: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  ],
  politics: [
    'https://feeds.bbci.co.uk/news/politics/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
  ],
  'human-interest': [
    'https://www.goodnewsnetwork.org/feed/',
  ],
  'us-president': [
    'https://news.google.com/rss/search?q=trump+president',
  ],
  usa: [
    'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/US.xml',
  ],
  minnesota: [
    'https://news.google.com/rss/search?q=minnesota+-sports+-vikings+-timberwolves',
  ],
  technopoly: [
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    'https://techcrunch.com/feed/',
  ],
  science: [
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    'https://www.sciencedaily.com/rss/all.xml',
  ],
};

export interface RSSArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  content?: string;
  image?: string;
}
