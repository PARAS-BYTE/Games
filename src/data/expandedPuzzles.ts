// Expanded 30+ Logic Rules & 30+ Emotional Scenarios for continuous 10-question sessions

export interface LogicRule {
  id: number;
  tier: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  ruleText: string;
  distractors: string[];
  explanation: string;
  check: (item: { shape: string; color: string; pattern: string; sides: number }) => boolean;
}

export const EXPANDED_LOGIC_RULES: LogicRule[] = [
  // EASY TIER (Warmup)
  {
    id: 1,
    tier: 'Easy',
    ruleText: 'All Golden Sun items',
    distractors: ['All Ocean Blue items', 'All Circles', 'All Star items'],
    explanation: 'Every accepted item has a bright golden sunlight hue.',
    check: (item) => item.color === 'sun',
  },
  {
    id: 2,
    tier: 'Easy',
    ruleText: 'All items with round edges (Circles)',
    distractors: ['All Triangles', 'All Green items', 'All Striped shapes'],
    explanation: 'Only smooth curved circles are allowed into this circle sanctuary.',
    check: (item) => item.shape === 'circle',
  },
  {
    id: 3,
    tier: 'Easy',
    ruleText: 'All Mint Green nature items',
    distractors: ['All Coral Red items', 'All Squares', 'All 4-sided shapes'],
    explanation: 'Only crisp mint green items are accepted.',
    check: (item) => item.color === 'mint',
  },
  {
    id: 4,
    tier: 'Easy',
    ruleText: 'All Stars with 5 points',
    distractors: ['All Circles', 'All Yellow items', 'All Dotted patterns'],
    explanation: 'Only 5-pointed star items pass the inspection.',
    check: (item) => item.shape === 'star',
  },
  {
    id: 5,
    tier: 'Easy',
    ruleText: 'All 4-sided Quad shapes (Squares)',
    distractors: ['All Triangles', 'All Sky Blue items', 'All Polka dots'],
    explanation: 'Any quadrilateral square shape is welcomed.',
    check: (item) => item.sides === 4,
  },
  {
    id: 6,
    tier: 'Easy',
    ruleText: 'All Coral Red ruby items',
    distractors: ['All Mint items', 'All Diamonds', 'All Stars'],
    explanation: 'The basket only accepts warm coral red pieces.',
    check: (item) => item.color === 'coral',
  },
  {
    id: 7,
    tier: 'Easy',
    ruleText: 'All 3-sided sharp Triangles',
    distractors: ['All Squares', 'All Circles', 'All Yellow shapes'],
    explanation: 'Only 3-cornered triangle shapes fit this law.',
    check: (item) => item.shape === 'triangle',
  },
  {
    id: 8,
    tier: 'Easy',
    ruleText: 'All Sky Blue crystal items',
    distractors: ['All Yellow items', 'All Red shapes', 'All Stars'],
    explanation: 'Only clear sky blue items pass through.',
    check: (item) => item.color === 'sky',
  },

  // MEDIUM TIER (Conjunctions, Disjunctions & Negations)
  {
    id: 9,
    tier: 'Medium',
    ruleText: 'Blue Sky AND Triangle (Pointed Blue)',
    distractors: ['Any Triangle', 'Any Blue shape', 'Yellow Star'],
    explanation: 'Must be blue in color AND have 3 sharp corners.',
    check: (item) => item.color === 'sky' && item.shape === 'triangle',
  },
  {
    id: 10,
    tier: 'Medium',
    ruleText: 'Green Mint AND Four Sides (Square)',
    distractors: ['Any Green item', 'Any Square', 'Red Circle'],
    explanation: 'Both the mint color and 4 square corners must be present.',
    check: (item) => item.color === 'mint' && item.sides === 4,
  },
  {
    id: 11,
    tier: 'Medium',
    ruleText: 'Yellow Sun AND Star shape',
    distractors: ['Any Star', 'Any Yellow item', 'Blue Triangle'],
    explanation: 'Must be a radiant yellow star.',
    check: (item) => item.color === 'sun' && item.shape === 'star',
  },
  {
    id: 12,
    tier: 'Medium',
    ruleText: 'Coral Red AND Round Circle',
    distractors: ['Any Red shape', 'Any Circle', 'Mint Square'],
    explanation: 'Must be both round and colored coral red.',
    check: (item) => item.color === 'coral' && item.shape === 'circle',
  },
  {
    id: 13,
    tier: 'Medium',
    ruleText: 'More than 3 sides AND NOT Sky Blue',
    distractors: ['Only Triangles', 'All Blue shapes', 'All Circles'],
    explanation: 'Squares and stars that are red, green, or yellow fit the secret rule.',
    check: (item) => item.sides > 3 && item.color !== 'sky',
  },
  {
    id: 14,
    tier: 'Medium',
    ruleText: 'Warm Colors only (Sun Yellow OR Coral Red)',
    distractors: ['Cool Colors (Mint or Blue)', 'Circles only', 'All Star shapes'],
    explanation: 'Only sunny yellow or coral red items are admitted.',
    check: (item) => item.color === 'sun' || item.color === 'coral',
  },
  {
    id: 15,
    tier: 'Medium',
    ruleText: 'Cool Colors only (Mint Green OR Sky Blue)',
    distractors: ['Warm Colors', 'Triangles only', 'Squares only'],
    explanation: 'Only peaceful mint green or sky blue artifacts pass.',
    check: (item) => item.color === 'mint' || item.color === 'sky',
  },
  {
    id: 16,
    tier: 'Medium',
    ruleText: 'Sharp Pointed Shapes (Triangle OR Star)',
    distractors: ['Smooth Shapes', 'Yellow shapes only', 'Blue shapes only'],
    explanation: 'Triangles and 5-point stars both qualify as sharp shapes.',
    check: (item) => item.shape === 'triangle' || item.shape === 'star',
  },
  {
    id: 17,
    tier: 'Medium',
    ruleText: 'Neither Coral Red NOR Circle',
    distractors: ['Must be Blue or Green', 'Must be a Star', 'No Squares allowed'],
    explanation: 'Excludes any coral red piece and any circle entirely.',
    check: (item) => item.color !== 'coral' && item.shape !== 'circle',
  },
  {
    id: 18,
    tier: 'Medium',
    ruleText: 'Sides >= 4 OR Color is Coral Red',
    distractors: ['Only Squares', 'Only Red items', 'Triangles only'],
    explanation: 'Accepted if it has at least 4 corners or radiates coral red.',
    check: (item) => item.sides >= 4 || item.color === 'coral',
  },

  // HARD TIER (Complex Conditionals, Deceptive Constraints & Multi-step)
  {
    id: 19,
    tier: 'Hard',
    ruleText: 'If it has 3 sides (Triangle), it MUST be Mint Green; other shapes may be any color',
    distractors: ['All Triangles must be Yellow', 'Only Green items', 'No Triangles allowed'],
    explanation: 'Triangles are strictly restricted to mint green; all other shapes pass freely.',
    check: (item) => (item.shape === 'triangle' ? item.color === 'mint' : true),
  },
  {
    id: 20,
    tier: 'Hard',
    ruleText: 'If it is Coral Red, it MUST be a Star; non-red items must NOT be Stars',
    distractors: ['All Stars are accepted', 'No Red items', 'All Squares must be Blue'],
    explanation: 'Stars can only exist in coral red, and other colors must use other shapes.',
    check: (item) => (item.color === 'coral' ? item.shape === 'star' : item.shape !== 'star'),
  },
  {
    id: 21,
    tier: 'Hard',
    ruleText: 'Even number of corners (Circle: 0, Square: 4) must be Sky Blue or Coral Red',
    distractors: ['All shapes with even sides', 'Only Blue Triangles', 'Odd sides only'],
    explanation: 'Circles (0 corners) and squares (4 corners) must be cool blue or warm coral.',
    check: (item) => (item.sides % 2 === 0 ? item.color === 'sky' || item.color === 'coral' : true),
  },
  {
    id: 22,
    tier: 'Hard',
    ruleText: 'NOT (Sun Yellow OR Triangle) — No yellow hue and no 3-sided shapes',
    distractors: ['Must be Blue or Green', 'Must be Star or Circle', 'No Squares'],
    explanation: 'Items fail if they are yellow, or if they are triangles.',
    check: (item) => item.color !== 'sun' && item.shape !== 'triangle',
  },
  {
    id: 23,
    tier: 'Hard',
    ruleText: 'Color Harmonic: Pointed (Triangle/Star) = Warm color; Smooth (Circle/Square) = Cool color',
    distractors: ['All items must be Cool', 'All items must be Warm', 'Only Squares and Stars'],
    explanation: 'Triangles and stars match sunshine/coral; circles and squares match mint/sky.',
    check: (item) =>
      item.shape === 'triangle' || item.shape === 'star'
        ? item.color === 'sun' || item.color === 'coral'
        : item.color === 'mint' || item.color === 'sky',
  },
  {
    id: 24,
    tier: 'Hard',
    ruleText: 'Odd number of corners (Triangle: 3, Star: 5) must NOT be Mint Green',
    distractors: ['All Triangles are Yellow', 'No Mint items at all', 'Only Squares and Circles'],
    explanation: 'Odd-cornered shapes are prohibited from bearing mint green.',
    check: (item) => (item.sides % 2 !== 0 ? item.color !== 'mint' : true),
  },
  {
    id: 25,
    tier: 'Hard',
    ruleText: 'Circle OR (Square AND NOT Coral Red)',
    distractors: ['Only Blue Circles', 'All Squares', 'No Red items'],
    explanation: 'Any circle passes; squares pass only if they are not coral red.',
    check: (item) => item.shape === 'circle' || (item.shape === 'square' && item.color !== 'coral'),
  },
  {
    id: 26,
    tier: 'Hard',
    ruleText: 'If Sun Yellow then Star, but if Sky Blue then NOT Star',
    distractors: ['All Yellow items', 'No Stars allowed', 'Only Blue items'],
    explanation: 'Yellow requires a star, but blue forbids stars.',
    check: (item) => {
      if (item.color === 'sun') return item.shape === 'star';
      if (item.color === 'sky') return item.shape !== 'star';
      return true;
    },
  },

  // EXPERT TIER (Boolean XOR, Modulo Parity, Mathematical & Biconditionals)
  {
    id: 27,
    tier: 'Expert',
    ruleText: 'Exclusive XOR: Must be Sun Yellow OR Square, but NEVER both',
    distractors: ['Both Yellow and Square', 'Neither Yellow nor Square', 'Only Red Circles'],
    explanation: 'Must possess either the yellow color or the square shape, never both simultaneously.',
    check: (item) => (item.color === 'sun') !== (item.shape === 'square'),
  },
  {
    id: 28,
    tier: 'Expert',
    ruleText: 'Exclusive XOR: Must be Sky Blue OR Triangle, but NEVER both',
    distractors: ['Both Blue and Triangle', 'Only Green Stars', 'Neither Blue nor Triangle'],
    explanation: 'Can be blue non-triangle, or non-blue triangle, but not blue triangle.',
    check: (item) => (item.color === 'sky') !== (item.shape === 'triangle'),
  },
  {
    id: 29,
    tier: 'Expert',
    ruleText: 'Modulo Parity: (Sides count + Color value) is strictly EVEN',
    distractors: ['Only odd corner shapes', 'Only primary colors', 'Squares and Stars only'],
    explanation: 'A deep numerical parity balance between corner count and color wavelength index.',
    check: (item) => {
      const colorVal = item.color === 'coral' ? 1 : item.color === 'mint' ? 2 : item.color === 'sky' ? 3 : 4;
      return (item.sides + colorVal) % 2 === 0;
    },
  },
  {
    id: 30,
    tier: 'Expert',
    ruleText: 'Modulo Parity: (Sides count + Color value) is strictly ODD',
    distractors: ['Always Even sum', 'Only Circles and Stars', 'No Yellow items'],
    explanation: 'Sum of geometric sides and chromatic index generates an odd resonance.',
    check: (item) => {
      const colorVal = item.color === 'coral' ? 1 : item.color === 'mint' ? 2 : item.color === 'sky' ? 3 : 4;
      return (item.sides + colorVal) % 2 !== 0;
    },
  },
  {
    id: 31,
    tier: 'Expert',
    ruleText: 'Biconditional (IFF): Item is a Star IF AND ONLY IF it is Sun Yellow',
    distractors: ['All Stars are Red', 'Yellow items must be Circles', 'No Stars allowed'],
    explanation: 'Every Star must be Yellow, and every non-Star must NOT be Yellow.',
    check: (item) => (item.shape === 'star') === (item.color === 'sun'),
  },
  {
    id: 32,
    tier: 'Expert',
    ruleText: 'Biconditional (IFF): Item is a Circle IF AND ONLY IF it is Coral Red',
    distractors: ['All Circles are Mint', 'No Red items', 'Only Squares'],
    explanation: 'Circles must be red, and red items must be circles.',
    check: (item) => (item.shape === 'circle') === (item.color === 'coral'),
  },
  {
    id: 33,
    tier: 'Expert',
    ruleText: 'Complex Triangle Guard: (Triangle -> Mint) AND (Star -> Yellow) AND (Square -> NOT Blue)',
    distractors: ['Any Triangle or Star', 'All Blue items', 'Only Circles allowed'],
    explanation: 'Three simultaneous conditional constraints governing each polygon type.',
    check: (item) => {
      if (item.shape === 'triangle' && item.color !== 'mint') return false;
      if (item.shape === 'star' && item.color !== 'sun') return false;
      if (item.shape === 'square' && item.color === 'sky') return false;
      return true;
    },
  },
  {
    id: 34,
    tier: 'Expert',
    ruleText: 'Asymmetric Inversion: If Cool Color then Corners >= 4; if Warm Color then Corners <= 3',
    distractors: ['All Cool Colors have 3 sides', 'Warm colors must be Squares', 'Only Red Circles'],
    explanation: 'Cool hues require high corner counts; warm hues restrict to low corner counts.',
    check: (item) => {
      const isCool = item.color === 'mint' || item.color === 'sky';
      return isCool ? item.sides >= 4 : item.sides <= 3;
    },
  },
];

export interface MoodScenarioItem {
  id: number;
  tier: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  situation: string;
  correctEmotion: 'happy' | 'sad' | 'surprised' | 'nervous' | 'content' | 'curious';
  explanation: string;
}

export const EXPANDED_MOOD_SCENARIOS: MoodScenarioItem[] = [
  // EASY
  {
    id: 1,
    tier: 'Easy',
    situation: 'Your grandma baked your favorite berry pie and handed you a warm slice!',
    correctEmotion: 'happy',
    explanation: 'Warm affection and delicious treats bring a beaming, joyful smile.',
  },
  {
    id: 2,
    tier: 'Easy',
    situation: 'It started pouring rain right as you were about to head to the playground.',
    correctEmotion: 'sad',
    explanation: 'Missing out on anticipated playtime causes gentle disappointment and sadness.',
  },
  {
    id: 3,
    tier: 'Easy',
    situation: 'You opened an envelope and confetti popped into the air!',
    correctEmotion: 'surprised',
    explanation: 'Unexpected delightful events widen our eyes in sudden surprise.',
  },
  {
    id: 4,
    tier: 'Easy',
    situation: 'You are waiting quietly in line for your first ever dentist check-up.',
    correctEmotion: 'nervous',
    explanation: 'Facing unfamiliar appointments often gives us butterflies and tight shoulders.',
  },
  {
    id: 5,
    tier: 'Easy',
    situation: 'You finished all your homework and are relaxing in a hammock with a book.',
    correctEmotion: 'content',
    explanation: 'Contentment is the gentle peace of having finished your duties and resting safely.',
  },
  {
    id: 6,
    tier: 'Easy',
    situation: 'You heard a strange gentle chirping sound coming from inside a flowerpot.',
    correctEmotion: 'curious',
    explanation: 'Unexplained little mysteries awaken our curiosity to investigate.',
  },
  {
    id: 7,
    tier: 'Easy',
    situation: 'Your puppy ran straight to you, wagging its tail and licking your hands!',
    correctEmotion: 'happy',
    explanation: 'Unconditional puppy affection fills our heart with pure joy.',
  },
  {
    id: 8,
    tier: 'Easy',
    situation: 'Your favorite ice cream scoop slipped off the cone onto the sidewalk.',
    correctEmotion: 'sad',
    explanation: 'Losing something sweet brings immediate sorrow.',
  },

  // MEDIUM
  {
    id: 9,
    tier: 'Medium',
    situation: 'Your friend accidentally spilled watercolor paint on the drawing you worked on all morning.',
    correctEmotion: 'sad',
    explanation: 'Losing hard work hurts even when it is an accident, making us feel sorrowful.',
  },
  {
    id: 10,
    tier: 'Medium',
    situation: 'The teacher announces that your team won first place in the science diorama contest!',
    correctEmotion: 'happy',
    explanation: 'Pride and shared success illuminate our face with joy.',
  },
  {
    id: 11,
    tier: 'Medium',
    situation: 'You are standing at the top of the high diving board looking down at the sparkling water.',
    correctEmotion: 'nervous',
    explanation: 'A thrilling height triggers cautious alertness and slight hesitation.',
  },
  {
    id: 12,
    tier: 'Medium',
    situation: 'You notice strange glowing green mushrooms growing in a perfect ring by the oak tree.',
    correctEmotion: 'curious',
    explanation: 'Fascinating natural oddities make our eyes widen with wonder and questions.',
  },
  {
    id: 13,
    tier: 'Medium',
    situation: 'A package arrived with no return address, wrapped in glittering silver ribbon.',
    correctEmotion: 'surprised',
    explanation: 'An anonymous gift sparks delightful astonishment.',
  },
  {
    id: 14,
    tier: 'Medium',
    situation: 'Sipping hot cocoa with marshmallows beside a warm fireplace on a snowy evening.',
    correctEmotion: 'content',
    explanation: 'Cozy warmth and comfort bring deep soothing contentment.',
  },
  {
    id: 15,
    tier: 'Medium',
    situation: 'You found an old wooden key under the floorboards of your grandparents attic.',
    correctEmotion: 'curious',
    explanation: 'An artifact from the past calls on your inner detective.',
  },

  // HARD & EXPERT
  {
    id: 16,
    tier: 'Hard',
    situation: 'You are saying goodbye to your best friend who is moving to another city for the school year.',
    correctEmotion: 'sad',
    explanation: 'Parting with someone dear brings deep tender grief and longing.',
  },
  {
    id: 17,
    tier: 'Hard',
    situation: 'The coach calls your name to take the decisive penalty shot with 5 seconds remaining.',
    correctEmotion: 'nervous',
    explanation: 'Huge responsibility in a critical moment creates tense focus and fluttering nerves.',
  },
  {
    id: 18,
    tier: 'Hard',
    situation: 'Watching the sunset tint the mountain ridge in peach and lavender after a long hiking journey.',
    correctEmotion: 'content',
    explanation: 'Gratitude for completing a big journey brings serene fulfillment.',
  },
  {
    id: 19,
    tier: 'Expert',
    situation: 'You were expecting a plain shirt for your birthday, but opened the box to find a puppy adoption certificate!',
    correctEmotion: 'surprised',
    explanation: 'A life-changing surprise leaves you breathless with sheer amazement.',
  },
  {
    id: 20,
    tier: 'Expert',
    situation: 'Seeing your little sister successfully ride her bicycle without training wheels for the first time.',
    correctEmotion: 'happy',
    explanation: 'Loving empathy makes someone else’s triumph feel like our own happiness.',
  },
  {
    id: 21,
    tier: 'Expert',
    situation: 'You made a difficult honest choice that disappointed others, but preserved your integrity.',
    correctEmotion: 'content',
    explanation: 'Standing by your moral values brings quiet, deep peace inside.',
  },
  {
    id: 22,
    tier: 'Hard',
    situation: 'You stepped onto the theater stage, the blinding spotlight hit your eyes, and for a split second your mind went blank.',
    correctEmotion: 'nervous',
    explanation: 'Stage fright and sudden exposure create visceral heart-pounding tension.',
  },
  {
    id: 23,
    tier: 'Hard',
    situation: 'You discover an ancient, handwritten diary tucked inside the hollow branch of an old willow tree.',
    correctEmotion: 'curious',
    explanation: 'Finding forgotten secrets stirs an intense drive to uncover the truth.',
  },
  {
    id: 24,
    tier: 'Hard',
    situation: 'After weeks of studying late, you see your name at the very top of the scholarship honour roll.',
    correctEmotion: 'happy',
    explanation: 'Overcoming rigorous hurdles into triumphant recognition fills one with euphoric joy.',
  },
  {
    id: 25,
    tier: 'Hard',
    situation: 'A loyal stray cat that visited your doorstep every morning for months has not appeared in four days.',
    correctEmotion: 'sad',
    explanation: 'The absence of a small cherished routine brings a quiet, heavy ache in the heart.',
  },
  {
    id: 26,
    tier: 'Hard',
    situation: 'You blow out the candles after cooking an entire feast by yourself for family Thanksgiving.',
    correctEmotion: 'content',
    explanation: 'Warm fatigue coupled with nurturing loved ones produces serene inner satisfaction.',
  },
  {
    id: 27,
    tier: 'Hard',
    situation: 'Turning the final corner of an unfamiliar mountain path, you find a crystal-clear hidden alpine lake reflecting snow peaks.',
    correctEmotion: 'surprised',
    explanation: 'Stumbling upon unforeseen breathtaking majesty leaves you in silent, open-mouthed wonder.',
  },
  {
    id: 28,
    tier: 'Expert',
    situation: 'You are awaiting the medical test results for someone you love dearly, watching the clinic door handle turn.',
    correctEmotion: 'nervous',
    explanation: 'Suspense on which a loved one’s future hangs pushes emotional vulnerability to its highest pitch.',
  },
  {
    id: 29,
    tier: 'Expert',
    situation: 'You gave away your only ticket to the sold-out championship game so your friend whose sibling played could attend.',
    correctEmotion: 'content',
    explanation: 'Selfless generosity transforms personal sacrifice into profound contentment.',
  },
  {
    id: 30,
    tier: 'Expert',
    situation: 'An old music box you thought was irreparably broken for years suddenly starts playing its forgotten melody on its own.',
    correctEmotion: 'surprised',
    explanation: 'The return of something deemed permanently lost feels magical and astonishing.',
  },
  {
    id: 31,
    tier: 'Expert',
    situation: 'Walking through your childhood elementary school hallway decades later and realizing everything looks tiny now.',
    correctEmotion: 'curious',
    explanation: 'Perspective shifts across time trigger deep nostalgic contemplation and questioning.',
  },
  {
    id: 32,
    tier: 'Expert',
    situation: 'Listening to the steady sound of autumn rain tapping against the tin roof while wrapped in a woolen quilt.',
    correctEmotion: 'content',
    explanation: 'Total security amidst the stormy elements outside fosters supreme cozy equilibrium.',
  },
  {
    id: 33,
    tier: 'Expert',
    situation: 'A quiet teammate who had been struggling all semester finally steps up and solves the impossible coding riddle for the whole class.',
    correctEmotion: 'happy',
    explanation: 'Watching an underdog bloom into brilliant triumph is one of the most uplifting joys.',
  },
  {
    id: 34,
    tier: 'Expert',
    situation: 'You realize that the reason a difficult classmate was harsh was because they were quietly dealing with family hardship at home.',
    correctEmotion: 'sad',
    explanation: 'Uncovering the hidden pain behind another person’s defense softens irritation into deep sorrow.',
  },
  {
    id: 35,
    tier: 'Expert',
    situation: 'Standing backstage holding the microphone as the announcer proclaims: "And now, our keynote speaker!"',
    correctEmotion: 'nervous',
    explanation: 'The threshold between anticipation and public execution is the apex of adrenaline.',
  },
  {
    id: 36,
    tier: 'Expert',
    situation: 'Looking at a star map and noticing a newly cataloged faint star that was never charted on any antique astronomy globe.',
    correctEmotion: 'curious',
    explanation: 'A cosmic anomaly in the heavens ignites the timeless curiosity of the explorer.',
  },
];
