// RSS Feed sources for each category
export const RSS_FEEDS = {
  israel: [
    'https://www.theguardian.com/world/israel/rss',
    'https://www.theguardian.com/world/middleeast/rss',
    
    'https://www.timesofisrael.com/feed/',
    'https://www.jpost.com/rss/rssfeedsheadlines.aspx',
    'https://www.i24news.tv/en/rss',
    'https://www.haaretz.com/cmlink/1.628816',
  ],
  international: [
    'https://www.theguardian.com/world/rss',
    'https://www.theguardian.com/international/rss',
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://feeds.npr.org/1004/rss.xml',
    'https://www.aljazeera.com/xml/rss/all.xml',
  ],
  'world-politics': [
    'https://www.theguardian.com/politics/rss',
    
    
    'https://feeds.npr.org/1014/rss.xml',
    'http://rss.cnn.com/rss/cnn_allpolitics.rss',
    
    'https://www.politico.com/rss/politics08.xml',
  ],
  'positive-news': [
    'https://www.goodnewsnetwork.org/feed/',
    'https://www.positive.news/feed/',
    'https://www.sunnyskyz.com/rss/good-news',
  ],
  'us-president': [
    'https://www.theguardian.com/us-news/us-politics/rss',
    'https://www.politico.com/rss/politics08.xml',
    'https://www.theatlantic.com/feed/channel/politics/',
    'https://feeds.feedburner.com/breitbart',
    'https://www.whitehouse.gov/feed/',
    'https://thehill.com/feed/',
    'https://nypost.com/politics/feed/',
    'https://www.newsmax.com/rss/Politics/',
    'https://www.salon.com/category/politics/feed/',
    'https://www.dailykos.com/blogs/main.rss',
  ],
  usa: [
    'https://www.theguardian.com/us-news/rss',
    
    'https://feeds.npr.org/1003/rss.xml',
    'http://rssfeeds.usatoday.com/UsatodaycomNation-TopStories',
  ],
  minnesota: [
    'https://www.startribune.com/local/index.rss2',
    'https://kstp.com/feed/',
    'https://www.mprnews.org/rss/news',
    'https://bringmethenews.com/feed',
    'https://www.twincities.com/feed/',
    'https://minnesota.cbslocal.com/feed/',
    'https://www.kare11.com/feeds/syndication/rss/news',
    'https://alphanewsmn.com/feed/',
    'https://www.fox9.com/feeds/public/rss/news',
    'https://www.mprnews.org/rss/statewide',
  ],
  technopoly: [
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    'https://techcrunch.com/feed/',
    'https://www.wired.com/feed/rss',
    'https://www.theverge.com/rss/index.xml',
    'http://feeds.arstechnica.com/arstechnica/index',
    'https://www.engadget.com/rss.xml',
    'https://www.cnet.com/rss/news/',
    'https://gizmodo.com/rss',
    'https://www.theguardian.com/technology/rss',
  ],
  science: [
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    'https://www.sciencedaily.com/rss/all.xml',
    'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    'http://feeds.nature.com/nature/rss/current',
    'https://www.popsci.com/feed',
    'https://phys.org/rss-feed/',
    'https://www.theguardian.com/science/rss',
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
