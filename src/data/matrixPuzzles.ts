// Large procedural bank of analytical 3x3 pattern matrix puzzles
// Rules cover Rotations, Additions/Subtractions, XOR set logic, progressions, and shape intersections

export interface MatrixCell {
  shape: 'circle' | 'square' | 'triangle' | 'diamond' | 'cross' | 'star' | 'empty';
  innerShape?: 'circle' | 'square' | 'dot' | 'none';
  color: string;
  rotation?: number; // degrees
  count?: number; // 1, 2, 3
  fill?: 'solid' | 'outline' | 'striped';
}

export interface MatrixPuzzle {
  id: string;
  tier: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  title: string;
  ruleExplanation: string;
  grid: (MatrixCell | null)[]; // 9 cells (last cell index 8 is null, the target)
  options: MatrixCell[]; // 6 options
  correctOptionIndex: number;
}

const COLORS = {
  blue: '#3CA2FF',
  coral: '#FF6565',
  mint: '#38B07D',
  sun: '#F5A623',
  purple: '#9B59B6',
  teal: '#1ABC9C',
};

// Generates a rich deterministic or randomized set of 35+ analytical matrix puzzles
export function generateMatrixPuzzles(): MatrixPuzzle[] {
  const puzzles: MatrixPuzzle[] = [
    // 0. EASY INTRODUCTORY PUZZLES (Easy: Rounds 1-2)
    {
      id: 'easy-shape-latin-1',
      tier: 'Easy',
      title: 'Elementary Shape Cycle',
      ruleExplanation: 'Each row contains exactly one Circle, one Square, and one Triangle.',
      grid: [
        { shape: 'circle', color: COLORS.blue, fill: 'solid' },
        { shape: 'square', color: COLORS.blue, fill: 'solid' },
        { shape: 'triangle', color: COLORS.blue, fill: 'solid' },
        { shape: 'square', color: COLORS.blue, fill: 'solid' },
        { shape: 'triangle', color: COLORS.blue, fill: 'solid' },
        { shape: 'circle', color: COLORS.blue, fill: 'solid' },
        { shape: 'triangle', color: COLORS.blue, fill: 'solid' },
        { shape: 'circle', color: COLORS.blue, fill: 'solid' },
        null, // Target: Square
      ],
      options: [
        { shape: 'diamond', color: COLORS.blue, fill: 'solid' },
        { shape: 'square', color: COLORS.blue, fill: 'solid' }, // Correct
        { shape: 'circle', color: COLORS.blue, fill: 'solid' },
        { shape: 'triangle', color: COLORS.blue, fill: 'solid' },
        { shape: 'star', color: COLORS.blue, fill: 'solid' },
        { shape: 'cross', color: COLORS.blue, fill: 'solid' },
      ],
      correctOptionIndex: 1,
    },
    {
      id: 'easy-color-cycle-1',
      tier: 'Easy',
      title: 'Chromatic Spectrum Flow',
      ruleExplanation: 'Each row follows Blue -> Mint -> Sun order.',
      grid: [
        { shape: 'diamond', color: COLORS.blue, fill: 'solid' },
        { shape: 'diamond', color: COLORS.mint, fill: 'solid' },
        { shape: 'diamond', color: COLORS.sun, fill: 'solid' },
        { shape: 'star', color: COLORS.blue, fill: 'solid' },
        { shape: 'star', color: COLORS.mint, fill: 'solid' },
        { shape: 'star', color: COLORS.sun, fill: 'solid' },
        { shape: 'circle', color: COLORS.blue, fill: 'solid' },
        { shape: 'circle', color: COLORS.mint, fill: 'solid' },
        null, // Target: circle sun
      ],
      options: [
        { shape: 'circle', color: COLORS.coral, fill: 'solid' },
        { shape: 'star', color: COLORS.sun, fill: 'solid' },
        { shape: 'circle', color: COLORS.sun, fill: 'solid' }, // Correct
        { shape: 'circle', color: COLORS.blue, fill: 'solid' },
        { shape: 'diamond', color: COLORS.sun, fill: 'solid' },
        { shape: 'circle', color: COLORS.mint, fill: 'solid' },
      ],
      correctOptionIndex: 2,
    },
    {
      id: 'easy-rotation-90-1',
      tier: 'Easy',
      title: 'Simple Orthogonal Turn',
      ruleExplanation: 'Each step rotates the cross symbol by 90 degrees.',
      grid: [
        { shape: 'cross', color: COLORS.teal, rotation: 0, fill: 'solid' },
        { shape: 'cross', color: COLORS.teal, rotation: 45, fill: 'solid' },
        { shape: 'cross', color: COLORS.teal, rotation: 90, fill: 'solid' },
        { shape: 'square', color: COLORS.coral, rotation: 0, fill: 'solid' },
        { shape: 'square', color: COLORS.coral, rotation: 45, fill: 'solid' },
        { shape: 'square', color: COLORS.coral, rotation: 90, fill: 'solid' },
        { shape: 'triangle', color: COLORS.purple, rotation: 0, fill: 'solid' },
        { shape: 'triangle', color: COLORS.purple, rotation: 45, fill: 'solid' },
        null, // Target: triangle rotated 90
      ],
      options: [
        { shape: 'triangle', color: COLORS.purple, rotation: 90, fill: 'solid' }, // Correct
        { shape: 'triangle', color: COLORS.purple, rotation: 0, fill: 'solid' },
        { shape: 'triangle', color: COLORS.coral, rotation: 90, fill: 'solid' },
        { shape: 'cross', color: COLORS.purple, rotation: 90, fill: 'solid' },
        { shape: 'square', color: COLORS.purple, rotation: 90, fill: 'solid' },
        { shape: 'triangle', color: COLORS.teal, rotation: 45, fill: 'solid' },
      ],
      correctOptionIndex: 0,
    },
    // 1. ROTATIONAL PROGRESSION (Medium)
    {
      id: 'rot-prog-1',
      tier: 'Medium',
      title: 'Orbital Vertex Shift',
      ruleExplanation: 'Each row rotates the pointer clockwise by 45 degrees.',
      grid: [
        { shape: 'triangle', color: COLORS.blue, rotation: 0, fill: 'solid' },
        { shape: 'triangle', color: COLORS.blue, rotation: 45, fill: 'solid' },
        { shape: 'triangle', color: COLORS.blue, rotation: 90, fill: 'solid' },
        { shape: 'diamond', color: COLORS.coral, rotation: 0, fill: 'solid' },
        { shape: 'diamond', color: COLORS.coral, rotation: 45, fill: 'solid' },
        { shape: 'diamond', color: COLORS.coral, rotation: 90, fill: 'solid' },
        { shape: 'star', color: COLORS.sun, rotation: 0, fill: 'solid' },
        { shape: 'star', color: COLORS.sun, rotation: 45, fill: 'solid' },
        null, // Target: star rotated 90
      ],
      options: [
        { shape: 'star', color: COLORS.sun, rotation: 90, fill: 'solid' }, // Correct
        { shape: 'star', color: COLORS.sun, rotation: 135, fill: 'solid' },
        { shape: 'star', color: COLORS.coral, rotation: 90, fill: 'solid' },
        { shape: 'diamond', color: COLORS.sun, rotation: 90, fill: 'solid' },
        { shape: 'star', color: COLORS.blue, rotation: 0, fill: 'solid' },
        { shape: 'triangle', color: COLORS.sun, rotation: 45, fill: 'solid' },
      ],
      correctOptionIndex: 0,
    },

    // 2. QUANTITY PROGRESSION + COLOR CYCLE (Medium)
    {
      id: 'quant-color-1',
      tier: 'Medium',
      title: 'Harmonic Quantum Growth',
      ruleExplanation: 'Rows increment item count (1, 2, 3) while columns follow color order.',
      grid: [
        { shape: 'circle', color: COLORS.mint, count: 1, fill: 'solid' },
        { shape: 'circle', color: COLORS.blue, count: 2, fill: 'solid' },
        { shape: 'circle', color: COLORS.purple, count: 3, fill: 'solid' },
        { shape: 'square', color: COLORS.mint, count: 1, fill: 'solid' },
        { shape: 'square', color: COLORS.blue, count: 2, fill: 'solid' },
        { shape: 'square', color: COLORS.purple, count: 3, fill: 'solid' },
        { shape: 'diamond', color: COLORS.mint, count: 1, fill: 'solid' },
        { shape: 'diamond', color: COLORS.blue, count: 2, fill: 'solid' },
        null, // Target: diamond, purple, count: 3
      ],
      options: [
        { shape: 'diamond', color: COLORS.blue, count: 3, fill: 'solid' },
        { shape: 'diamond', color: COLORS.purple, count: 3, fill: 'solid' }, // Correct
        { shape: 'diamond', color: COLORS.purple, count: 2, fill: 'solid' },
        { shape: 'square', color: COLORS.purple, count: 3, fill: 'solid' },
        { shape: 'circle', color: COLORS.purple, count: 3, fill: 'solid' },
        { shape: 'diamond', color: COLORS.mint, count: 3, fill: 'solid' },
      ],
      correctOptionIndex: 1,
    },

    // 3. SHAPE OVERLAY / INNER CORE TRANSFORMATION (Hard)
    {
      id: 'nested-core-1',
      tier: 'Hard',
      title: 'Nested Core Dual Matrix',
      ruleExplanation: 'Outer shape repeats per row; inner shape follows column progression (Dot -> Square -> Circle).',
      grid: [
        { shape: 'circle', innerShape: 'dot', color: COLORS.blue, fill: 'outline' },
        { shape: 'circle', innerShape: 'square', color: COLORS.blue, fill: 'outline' },
        { shape: 'circle', innerShape: 'circle', color: COLORS.blue, fill: 'outline' },
        { shape: 'square', innerShape: 'dot', color: COLORS.coral, fill: 'outline' },
        { shape: 'square', innerShape: 'square', color: COLORS.coral, fill: 'outline' },
        { shape: 'square', innerShape: 'circle', color: COLORS.coral, fill: 'outline' },
        { shape: 'diamond', innerShape: 'dot', color: COLORS.mint, fill: 'outline' },
        { shape: 'diamond', innerShape: 'square', color: COLORS.mint, fill: 'outline' },
        null, // Target: diamond outer, circle inner, mint
      ],
      options: [
        { shape: 'diamond', innerShape: 'square', color: COLORS.mint, fill: 'outline' },
        { shape: 'circle', innerShape: 'circle', color: COLORS.mint, fill: 'outline' },
        { shape: 'diamond', innerShape: 'circle', color: COLORS.mint, fill: 'outline' }, // Correct
        { shape: 'diamond', innerShape: 'dot', color: COLORS.coral, fill: 'outline' },
        { shape: 'diamond', innerShape: 'none', color: COLORS.mint, fill: 'solid' },
        { shape: 'square', innerShape: 'circle', color: COLORS.blue, fill: 'outline' },
      ],
      correctOptionIndex: 2,
    },

    // 4. SET INTERSECTION / ATTRIBUTE XOR (Hard)
    {
      id: 'xor-set-1',
      tier: 'Hard',
      title: 'Binary Set Resonance',
      ruleExplanation: 'Third column is the logical difference between the first two columns (Fill alternates solid -> outline -> striped).',
      grid: [
        { shape: 'cross', color: COLORS.purple, fill: 'solid' },
        { shape: 'cross', color: COLORS.purple, fill: 'outline' },
        { shape: 'cross', color: COLORS.purple, fill: 'striped' },
        { shape: 'star', color: COLORS.sun, fill: 'solid' },
        { shape: 'star', color: COLORS.sun, fill: 'outline' },
        { shape: 'star', color: COLORS.sun, fill: 'striped' },
        { shape: 'circle', color: COLORS.teal, fill: 'solid' },
        { shape: 'circle', color: COLORS.teal, fill: 'outline' },
        null, // Target: circle, teal, striped
      ],
      options: [
        { shape: 'circle', color: COLORS.teal, fill: 'solid' },
        { shape: 'star', color: COLORS.teal, fill: 'striped' },
        { shape: 'circle', color: COLORS.purple, fill: 'striped' },
        { shape: 'circle', color: COLORS.teal, fill: 'striped' }, // Correct
        { shape: 'circle', color: COLORS.sun, fill: 'outline' },
        { shape: 'diamond', color: COLORS.teal, fill: 'striped' },
      ],
      correctOptionIndex: 3,
    },

    // 5. COMBINATORIAL SYMMETRY & CORNER SUM (Expert)
    {
      id: 'corner-parity-1',
      tier: 'Expert',
      title: 'Geometric Topology Matrix',
      ruleExplanation: 'Across every row and column, shapes have 3 (triangle), 4 (square), and 5 (star) vertices with unique colors.',
      grid: [
        { shape: 'triangle', color: COLORS.blue, fill: 'solid' },
        { shape: 'square', color: COLORS.coral, fill: 'solid' },
        { shape: 'star', color: COLORS.mint, fill: 'solid' },
        { shape: 'square', color: COLORS.mint, fill: 'solid' },
        { shape: 'star', color: COLORS.blue, fill: 'solid' },
        { shape: 'triangle', color: COLORS.coral, fill: 'solid' },
        { shape: 'star', color: COLORS.coral, fill: 'solid' },
        { shape: 'triangle', color: COLORS.mint, fill: 'solid' },
        null, // Target: square, blue (to complete row: star(coral), tri(mint), square(blue))
      ],
      options: [
        { shape: 'square', color: COLORS.coral, fill: 'solid' },
        { shape: 'star', color: COLORS.blue, fill: 'solid' },
        { shape: 'triangle', color: COLORS.blue, fill: 'solid' },
        { shape: 'square', color: COLORS.mint, fill: 'solid' },
        { shape: 'square', color: COLORS.blue, fill: 'solid' }, // Correct
        { shape: 'circle', color: COLORS.blue, fill: 'solid' },
      ],
      correctOptionIndex: 4,
    },

    // 6. DUAL DIAGONAL INVERSION (Expert)
    {
      id: 'diagonal-inv-1',
      tier: 'Expert',
      title: 'Axial Matrix Inversion',
      ruleExplanation: 'The matrix reflects along the main diagonal; opposite cells swap rotation angles inverted by 180 degrees.',
      grid: [
        { shape: 'diamond', color: COLORS.purple, rotation: 0, fill: 'solid' },
        { shape: 'triangle', color: COLORS.sun, rotation: 90, fill: 'solid' },
        { shape: 'circle', color: COLORS.blue, rotation: 45, fill: 'solid' },
        { shape: 'triangle', color: COLORS.sun, rotation: 270, fill: 'solid' },
        { shape: 'diamond', color: COLORS.purple, rotation: 0, fill: 'solid' },
        { shape: 'cross', color: COLORS.coral, rotation: 45, fill: 'solid' },
        { shape: 'circle', color: COLORS.blue, rotation: 225, fill: 'solid' },
        { shape: 'cross', color: COLORS.coral, rotation: 225, fill: 'solid' },
        null, // Target: diamond, purple, rotation: 0
      ],
      options: [
        { shape: 'diamond', color: COLORS.purple, rotation: 90, fill: 'solid' },
        { shape: 'diamond', color: COLORS.sun, rotation: 0, fill: 'solid' },
        { shape: 'diamond', color: COLORS.purple, rotation: 0, fill: 'solid' }, // Correct
        { shape: 'cross', color: COLORS.purple, rotation: 0, fill: 'solid' },
        { shape: 'circle', color: COLORS.purple, rotation: 0, fill: 'solid' },
        { shape: 'triangle', color: COLORS.blue, rotation: 0, fill: 'solid' },
      ],
      correctOptionIndex: 2,
    },

    // 7. MULTI-LEVEL SCALE TRANSFORM (Hard)
    {
      id: 'scale-matrix-1',
      tier: 'Hard',
      title: 'Progressive Dimension Expansion',
      ruleExplanation: 'Item sizes scale from compact to medium to expansive while maintaining shape family.',
      grid: [
        { shape: 'circle', color: COLORS.mint, count: 1, fill: 'solid' },
        { shape: 'circle', color: COLORS.mint, count: 2, fill: 'solid' },
        { shape: 'circle', color: COLORS.mint, count: 3, fill: 'solid' },
        { shape: 'cross', color: COLORS.sun, count: 1, fill: 'solid' },
        { shape: 'cross', color: COLORS.sun, count: 2, fill: 'solid' },
        { shape: 'cross', color: COLORS.sun, count: 3, fill: 'solid' },
        { shape: 'star', color: COLORS.purple, count: 1, fill: 'solid' },
        { shape: 'star', color: COLORS.purple, count: 2, fill: 'solid' },
        null, // Target: star, purple, count 3
      ],
      options: [
        { shape: 'star', color: COLORS.purple, count: 2, fill: 'solid' },
        { shape: 'star', color: COLORS.mint, count: 3, fill: 'solid' },
        { shape: 'star', color: COLORS.purple, count: 3, fill: 'solid' }, // Correct
        { shape: 'cross', color: COLORS.purple, count: 3, fill: 'solid' },
        { shape: 'circle', color: COLORS.purple, count: 3, fill: 'solid' },
        { shape: 'diamond', color: COLORS.purple, count: 3, fill: 'solid' },
      ],
      correctOptionIndex: 2,
    },

    // 8. POLARITY AND COMPLEMENT MATRIX (Expert)
    {
      id: 'polarity-matrix-1',
      tier: 'Expert',
      title: 'Chromatic Polarity Complement',
      ruleExplanation: 'Warm hues (Sun, Coral) invert to Cool hues (Sky, Mint) with complementary vertex count (Sides A + Sides B = 8).',
      grid: [
        { shape: 'triangle', color: COLORS.sun, fill: 'solid' }, // 3 sides, warm
        { shape: 'diamond', color: COLORS.blue, fill: 'solid' }, // 4 sides, cool
        { shape: 'star', color: COLORS.coral, fill: 'solid' },   // 5 sides, warm
        { shape: 'star', color: COLORS.coral, fill: 'solid' },
        { shape: 'triangle', color: COLORS.sun, fill: 'solid' },
        { shape: 'diamond', color: COLORS.blue, fill: 'solid' },
        { shape: 'diamond', color: COLORS.blue, fill: 'solid' },
        { shape: 'star', color: COLORS.coral, fill: 'solid' },
        null, // Target: triangle, sun
      ],
      options: [
        { shape: 'star', color: COLORS.sun, fill: 'solid' },
        { shape: 'triangle', color: COLORS.sun, fill: 'solid' }, // Correct
        { shape: 'triangle', color: COLORS.blue, fill: 'solid' },
        { shape: 'diamond', color: COLORS.sun, fill: 'solid' },
        { shape: 'square', color: COLORS.coral, fill: 'solid' },
        { shape: 'circle', color: COLORS.sun, fill: 'solid' },
      ],
      correctOptionIndex: 1,
    },
    
    // 9. CONTINUOUS ROTATIONAL MODULO (Hard)
    {
      id: 'rot-modulo-1',
      tier: 'Hard',
      title: 'Cyclic Quadrant Vector',
      ruleExplanation: 'Each step adds 90 degrees clockwise; color shifts with each completed half-turn.',
      grid: [
        { shape: 'diamond', color: COLORS.coral, rotation: 0, fill: 'solid' },
        { shape: 'diamond', color: COLORS.coral, rotation: 90, fill: 'solid' },
        { shape: 'diamond', color: COLORS.teal, rotation: 180, fill: 'solid' },
        { shape: 'diamond', color: COLORS.teal, rotation: 270, fill: 'solid' },
        { shape: 'diamond', color: COLORS.purple, rotation: 0, fill: 'solid' },
        { shape: 'diamond', color: COLORS.purple, rotation: 90, fill: 'solid' },
        { shape: 'diamond', color: COLORS.sun, rotation: 180, fill: 'solid' },
        { shape: 'diamond', color: COLORS.sun, rotation: 270, fill: 'solid' },
        null, // Target: diamond, coral, 0 degrees
      ],
      options: [
        { shape: 'diamond', color: COLORS.sun, rotation: 0, fill: 'solid' },
        { shape: 'diamond', color: COLORS.coral, rotation: 0, fill: 'solid' }, // Correct
        { shape: 'diamond', color: COLORS.coral, rotation: 90, fill: 'solid' },
        { shape: 'star', color: COLORS.coral, rotation: 0, fill: 'solid' },
        { shape: 'square', color: COLORS.teal, rotation: 0, fill: 'solid' },
        { shape: 'diamond', color: COLORS.purple, rotation: 270, fill: 'solid' },
      ],
      correctOptionIndex: 1,
    },

    // 10. MATRIX INTERSECTION HARMONY (Expert)
    {
      id: 'harmony-cross-1',
      tier: 'Expert',
      title: 'Synergistic Cross Lattice',
      ruleExplanation: 'Center column has outlines; outer columns are solid; shapes match across horizontal mirror axis.',
      grid: [
        { shape: 'triangle', color: COLORS.mint, fill: 'solid' },
        { shape: 'triangle', color: COLORS.mint, fill: 'outline' },
        { shape: 'triangle', color: COLORS.mint, fill: 'solid' },
        { shape: 'circle', color: COLORS.blue, fill: 'solid' },
        { shape: 'circle', color: COLORS.blue, fill: 'outline' },
        { shape: 'circle', color: COLORS.blue, fill: 'solid' },
        { shape: 'square', color: COLORS.coral, fill: 'solid' },
        { shape: 'square', color: COLORS.coral, fill: 'outline' },
        null, // Target: square, coral, solid
      ],
      options: [
        { shape: 'square', color: COLORS.coral, fill: 'outline' },
        { shape: 'triangle', color: COLORS.coral, fill: 'solid' },
        { shape: 'circle', color: COLORS.coral, fill: 'solid' },
        { shape: 'square', color: COLORS.coral, fill: 'solid' }, // Correct
        { shape: 'square', color: COLORS.mint, fill: 'solid' },
        { shape: 'star', color: COLORS.coral, fill: 'solid' },
      ],
      correctOptionIndex: 3,
    },
  ];

  // Procedurally generate additional variations by permutation of colors & shapes
  const extraPuzzles: MatrixPuzzle[] = [];
  const baseShapes: Array<'circle' | 'square' | 'triangle' | 'diamond' | 'cross' | 'star'> = [
    'circle', 'square', 'triangle', 'diamond', 'cross', 'star'
  ];
  const colorList = Object.values(COLORS);

  for (let k = 1; k <= 25; k++) {
    const s1 = baseShapes[k % baseShapes.length];
    const s2 = baseShapes[(k + 2) % baseShapes.length];
    const s3 = baseShapes[(k + 4) % baseShapes.length];
    const c1 = colorList[k % colorList.length];
    const c2 = colorList[(k + 1) % colorList.length];
    const c3 = colorList[(k + 2) % colorList.length];

    extraPuzzles.push({
      id: `proc-matrix-${k}`,
      tier: k % 3 === 0 ? 'Expert' : k % 2 === 0 ? 'Hard' : 'Medium',
      title: `Algorithmic Matrix #${k + 10}`,
      ruleExplanation: `Row order follows shape sequence (${s1} -> ${s2} -> ${s3}), columns follow chromatic resonance.`,
      grid: [
        { shape: s1, color: c1, fill: 'solid' },
        { shape: s2, color: c1, fill: 'solid' },
        { shape: s3, color: c1, fill: 'solid' },
        { shape: s1, color: c2, fill: 'solid' },
        { shape: s2, color: c2, fill: 'solid' },
        { shape: s3, color: c2, fill: 'solid' },
        { shape: s1, color: c3, fill: 'solid' },
        { shape: s2, color: c3, fill: 'solid' },
        null, // Target: s3, c3, solid
      ],
      options: [
        { shape: s1, color: c3, fill: 'solid' },
        { shape: s2, color: c3, fill: 'solid' },
        { shape: s3, color: c3, fill: 'solid' }, // Correct
        { shape: s3, color: c1, fill: 'solid' },
        { shape: s3, color: c2, fill: 'solid' },
        { shape: s2, color: c2, fill: 'solid' },
      ],
      correctOptionIndex: 2,
    });
  }

  return [...puzzles, ...extraPuzzles];
}
