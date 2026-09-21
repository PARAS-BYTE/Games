// Procedural and handcrafted balance scale deduction puzzles
// Algebraic and relational reasoning with visual balance scales

export interface WeightItem {
  id: string;
  name: string;
  shape: 'pyramid' | 'cube' | 'sphere' | 'gem' | 'cylinder';
  color: string;
  symbol: string;
}

export interface BalanceScalePair {
  left: { item: WeightItem; count: number }[];
  right: { item: WeightItem; count: number }[];
}

export interface BalancePuzzle {
  id: string;
  tier: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  title: string;
  description: string;
  premiseScales: BalanceScalePair[]; // 1 or 2 scales in balance
  targetScaleLeft: { item: WeightItem; count: number }[]; // Left side of mystery scale
  options: {
    items: { item: WeightItem; count: number }[];
    isCorrect: boolean;
  }[];
  explanation: string;
}

export const WEIGHT_ITEMS: Record<string, WeightItem> = {
  pyramid: { id: 'pyramid', name: 'Pyramid', shape: 'pyramid', color: '#FF6565', symbol: '▲' },
  cube: { id: 'cube', name: 'Cube', shape: 'cube', color: '#3CA2FF', symbol: '■' },
  sphere: { id: 'sphere', name: 'Sphere', shape: 'sphere', color: '#38B07D', symbol: '●' },
  gem: { id: 'gem', name: 'Gem', shape: 'gem', color: '#F5A623', symbol: '◆' },
  cylinder: { id: 'cylinder', name: 'Cylinder', shape: 'cylinder', color: '#9B59B6', symbol: '⬟' },
};

export function generateBalancePuzzles(): BalancePuzzle[] {
  const puzzles: BalancePuzzle[] = [
    // 0. EASY INTRODUCTORY SCALES (Easy: Rounds 1-2)
    {
      id: 'bal-easy-1',
      tier: 'Easy',
      title: 'Direct Gem Proportions',
      description: 'Observe the scale above and find the exact balance for 2 Gems.',
      premiseScales: [
        {
          left: [{ item: WEIGHT_ITEMS.gem, count: 1 }],
          right: [{ item: WEIGHT_ITEMS.pyramid, count: 2 }],
        },
      ],
      targetScaleLeft: [{ item: WEIGHT_ITEMS.gem, count: 2 }],
      options: [
        { items: [{ item: WEIGHT_ITEMS.pyramid, count: 3 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.pyramid, count: 4 }], isCorrect: true },
        { items: [{ item: WEIGHT_ITEMS.sphere, count: 2 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.cube, count: 1 }], isCorrect: false },
      ],
      explanation: 'If 1 Gem weighs 2 Pyramids, then 2 Gems must weigh 4 Pyramids.',
    },
    {
      id: 'bal-easy-2',
      tier: 'Easy',
      title: 'Simple Cube Equivalence',
      description: 'Observe the known balance and deduce what balances 2 Cubes.',
      premiseScales: [
        {
          left: [{ item: WEIGHT_ITEMS.cube, count: 1 }],
          right: [{ item: WEIGHT_ITEMS.sphere, count: 3 }],
        },
      ],
      targetScaleLeft: [{ item: WEIGHT_ITEMS.cube, count: 2 }],
      options: [
        { items: [{ item: WEIGHT_ITEMS.sphere, count: 5 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.sphere, count: 6 }], isCorrect: true },
        { items: [{ item: WEIGHT_ITEMS.pyramid, count: 4 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.gem, count: 3 }], isCorrect: false },
      ],
      explanation: 'If 1 Cube = 3 Spheres, doubling both sides yields 2 Cubes = 6 Spheres.',
    },
    // 1. Direct substitution (Medium)
    // 1 Cube = 2 Spheres. 1 Sphere = 2 Pyramids. Target: 1 Cube = ?
    {
      id: 'bal-1',
      tier: 'Medium',
      title: 'Elementary Weight Transfer',
      description: 'Find the set of weights that perfectly balances the mystery scale.',
      premiseScales: [
        {
          left: [{ item: WEIGHT_ITEMS.cube, count: 1 }],
          right: [{ item: WEIGHT_ITEMS.sphere, count: 2 }],
        },
        {
          left: [{ item: WEIGHT_ITEMS.sphere, count: 1 }],
          right: [{ item: WEIGHT_ITEMS.pyramid, count: 2 }],
        },
      ],
      targetScaleLeft: [{ item: WEIGHT_ITEMS.cube, count: 1 }],
      options: [
        { items: [{ item: WEIGHT_ITEMS.pyramid, count: 3 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.pyramid, count: 4 }], isCorrect: true }, // 1 Cube = 2 Spheres = 4 Pyramids
        { items: [{ item: WEIGHT_ITEMS.gem, count: 2 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.sphere, count: 3 }], isCorrect: false },
      ],
      explanation: 'Since 1 Cube = 2 Spheres, and each Sphere = 2 Pyramids, 1 Cube = 4 Pyramids.',
    },

    // 2. Additive elimination (Medium)
    // 1 Gem + 1 Cube = 4 Pyramids. 1 Cube = 2 Pyramids. Target: 1 Gem = ?
    {
      id: 'bal-2',
      tier: 'Medium',
      title: 'Additive Equilibrium',
      description: 'Deduce the unknown mass of the Golden Gem.',
      premiseScales: [
        {
          left: [{ item: WEIGHT_ITEMS.gem, count: 1 }, { item: WEIGHT_ITEMS.cube, count: 1 }],
          right: [{ item: WEIGHT_ITEMS.pyramid, count: 4 }],
        },
        {
          left: [{ item: WEIGHT_ITEMS.cube, count: 1 }],
          right: [{ item: WEIGHT_ITEMS.pyramid, count: 2 }],
        },
      ],
      targetScaleLeft: [{ item: WEIGHT_ITEMS.gem, count: 1 }],
      options: [
        { items: [{ item: WEIGHT_ITEMS.pyramid, count: 2 }], isCorrect: true }, // Gem = 4 - 2 = 2 Pyramids
        { items: [{ item: WEIGHT_ITEMS.pyramid, count: 1 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.pyramid, count: 3 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.sphere, count: 2 }], isCorrect: false },
      ],
      explanation: 'Subtracting 1 Cube (2 Pyramids) from 4 Pyramids leaves 2 Pyramids for 1 Gem.',
    },

    // 3. Multi-Variable System (Hard)
    // 2 Spheres = 1 Cylinder. 1 Cylinder + 1 Cube = 5 Pyramids. 1 Sphere = 1 Pyramid. Target: 1 Cube = ?
    {
      id: 'bal-3',
      tier: 'Hard',
      title: 'Compound Harmonic Balance',
      description: 'Solve the multi-variable balance system.',
      premiseScales: [
        {
          left: [{ item: WEIGHT_ITEMS.sphere, count: 2 }],
          right: [{ item: WEIGHT_ITEMS.cylinder, count: 1 }],
        },
        {
          left: [{ item: WEIGHT_ITEMS.cylinder, count: 1 }, { item: WEIGHT_ITEMS.cube, count: 1 }],
          right: [{ item: WEIGHT_ITEMS.pyramid, count: 5 }],
        },
        {
          left: [{ item: WEIGHT_ITEMS.sphere, count: 1 }],
          right: [{ item: WEIGHT_ITEMS.pyramid, count: 1 }],
        },
      ],
      targetScaleLeft: [{ item: WEIGHT_ITEMS.cube, count: 1 }],
      options: [
        { items: [{ item: WEIGHT_ITEMS.pyramid, count: 2 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.pyramid, count: 3 }], isCorrect: true }, // Cylinder = 2 Pyramids. Cube = 5 - 2 = 3 Pyramids
        { items: [{ item: WEIGHT_ITEMS.pyramid, count: 4 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.sphere, count: 4 }], isCorrect: false },
      ],
      explanation: 'Sphere = 1 Pyramid => Cylinder = 2 Pyramids => Cube = 5 - 2 = 3 Pyramids.',
    },

    // 4. Proportional Fraction Balance (Hard)
    // 3 Gems = 6 Spheres. 2 Cylinders = 2 Gems. Target: 1 Cylinder = ?
    {
      id: 'bal-4',
      tier: 'Hard',
      title: 'Proportional Equivalence',
      description: 'Calculate the proportional weight of the purple cylinder.',
      premiseScales: [
        {
          left: [{ item: WEIGHT_ITEMS.gem, count: 3 }],
          right: [{ item: WEIGHT_ITEMS.sphere, count: 6 }],
        },
        {
          left: [{ item: WEIGHT_ITEMS.cylinder, count: 2 }],
          right: [{ item: WEIGHT_ITEMS.gem, count: 2 }],
        },
      ],
      targetScaleLeft: [{ item: WEIGHT_ITEMS.cylinder, count: 1 }],
      options: [
        { items: [{ item: WEIGHT_ITEMS.sphere, count: 1 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.sphere, count: 2 }], isCorrect: true }, // 1 Gem = 2 Spheres. 1 Cylinder = 1 Gem = 2 Spheres
        { items: [{ item: WEIGHT_ITEMS.sphere, count: 3 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.cube, count: 2 }], isCorrect: false },
      ],
      explanation: '1 Gem = 2 Spheres. 1 Cylinder = 1 Gem, so 1 Cylinder = 2 Spheres.',
    },

    // 5. Algebraic Matrix Constraint (Expert)
    // 1 Cylinder + 2 Pyramids = 1 Cube + 1 Gem. 1 Gem = 2 Pyramids. 1 Cube = 2 Cylinders. Target: 1 Cylinder = ?
    {
      id: 'bal-5',
      tier: 'Expert',
      title: 'Simultaneous Weight Singularity',
      description: 'Deduce the fundamental unit value of the Cylinder.',
      premiseScales: [
        {
          left: [{ item: WEIGHT_ITEMS.cylinder, count: 1 }, { item: WEIGHT_ITEMS.pyramid, count: 2 }],
          right: [{ item: WEIGHT_ITEMS.cube, count: 1 }, { item: WEIGHT_ITEMS.gem, count: 1 }],
        },
        {
          left: [{ item: WEIGHT_ITEMS.gem, count: 1 }],
          right: [{ item: WEIGHT_ITEMS.pyramid, count: 2 }],
        },
        {
          left: [{ item: WEIGHT_ITEMS.cube, count: 1 }],
          right: [{ item: WEIGHT_ITEMS.cylinder, count: 2 }],
        },
      ],
      targetScaleLeft: [{ item: WEIGHT_ITEMS.cylinder, count: 2 }],
      options: [
        { items: [{ item: WEIGHT_ITEMS.pyramid, count: 2 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.cube, count: 1 }], isCorrect: true }, // Direct from Scale 3: 2 Cylinders = 1 Cube
        { items: [{ item: WEIGHT_ITEMS.gem, count: 2 }], isCorrect: false },
        { items: [{ item: WEIGHT_ITEMS.sphere, count: 3 }], isCorrect: false },
      ],
      explanation: 'From Scale 3, 2 Cylinders directly equate to 1 Cube in perfect balance.',
    },
  ];

  // Generate 25 procedural variations for high replayability
  const items = Object.values(WEIGHT_ITEMS);
  for (let i = 1; i <= 25; i++) {
    const itemA = items[i % items.length];
    const itemB = items[(i + 1) % items.length];
    const itemC = items[(i + 2) % items.length];
    const ratio1 = (i % 3) + 2; // 2, 3, or 4
    const ratio2 = ((i + 1) % 2) + 2; // 2 or 3

    puzzles.push({
      id: `bal-proc-${i}`,
      tier: i % 3 === 0 ? 'Expert' : i % 2 === 0 ? 'Hard' : 'Medium',
      title: `Harmonic Scale #${i + 5}`,
      description: 'Compute the matching balance weights using linear substitution.',
      premiseScales: [
        {
          left: [{ item: itemA, count: 1 }],
          right: [{ item: itemB, count: ratio1 }],
        },
        {
          left: [{ item: itemB, count: 1 }],
          right: [{ item: itemC, count: ratio2 }],
        },
      ],
      targetScaleLeft: [{ item: itemA, count: 1 }],
      options: [
        { items: [{ item: itemC, count: ratio1 * ratio2 - 1 }], isCorrect: false },
        { items: [{ item: itemC, count: ratio1 * ratio2 }], isCorrect: true }, // Correct product
        { items: [{ item: itemC, count: ratio1 * ratio2 + 1 }], isCorrect: false },
        { items: [{ item: itemB, count: ratio1 - 1 }], isCorrect: false },
      ],
      explanation: `1 ${itemA.name} = ${ratio1} ${itemB.name}s, and each ${itemB.name} = ${ratio2} ${itemC.name}s, yielding ${ratio1 * ratio2} ${itemC.name}s.`,
    });
  }

  return puzzles;
}
