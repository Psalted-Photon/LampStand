export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    name: string;
  };
  content?: string;
  fullContent?: string;
  extractionFailed?: boolean;
}

export interface Theme {
  name: string;
  passages: Passage[];
}

export interface Passage {
  reference: string;
  connection: string;
  isProphetic: boolean;
  scriptureText?: string;
}

export interface AnalysisResponse {
  themes: Theme[];
}

export type Category = 
  | 'israel'
  | 'international'
  | 'world-politics'
  | 'positive-news'
  | 'us-president'
  | 'usa'
  | 'minnesota'
  | 'technopoly'
  | 'science';

export const CATEGORY_LABELS: Record<Category, string> = {
  'israel': 'Israel',
  'international': 'World News',
  'world-politics': 'World Politics',
  'positive-news': 'Positive News',
  'us-president': 'US President',
  'usa': 'USA',
  'minnesota': 'Minnesota',
  'technopoly': 'Technopoly',
  'science': 'Science'
};

export const CATEGORY_QUERIES: Record<Category, string> = {
  'israel': '(israel OR israeli OR jerusalem OR netanyahu) -sports',
  'international': '(world OR global OR disaster OR conflict OR humanitarian OR earthquake OR flood OR refugee OR crisis) -politics -election -vote -government -policy -law -legislation -middle east -sports -entertainment',
  'world-politics': '(politics OR election OR government OR policy OR parliament OR congress OR minister OR president OR vote OR legislation) -sports -entertainment',
  'positive-news': '(heartwarming OR uplifting OR community OR volunteer OR hero OR rescue OR kindness OR charity OR family OR children OR inspiring OR miracle OR good news) -sports -entertainment -movie -film -celebrity',
  'us-president': '"donald trump" president -sports -entertainment',
  'usa': '(usa OR america) -international -sports',
  'minnesota': 'minnesota -sports -vikings -timberwolves -twins -wild -football -basketball -baseball -hockey -nfl -nba -mlb -nhl -game -athlete -player -coach',
  'technopoly': '(technology OR ai OR "artificial intelligence" OR computer OR software OR tech OR gadget OR electronics OR digital OR cyber OR robot OR automation OR app) -sports -entertainment',
  'science': '(science OR biology OR physics OR chemistry OR discovery OR research OR study OR medical OR health OR space OR astronomy OR climate OR environment OR nature) -sports -entertainment'
};
