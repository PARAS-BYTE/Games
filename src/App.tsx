import React, { useState } from 'react';
import { WorldMap } from './components/layout/WorldMap';
import { MatrixLogic } from './games/MatrixLogic/MatrixLogic';
import { BalanceLogic } from './games/BalanceLogic/BalanceLogic';
import { MemoryGrid } from './games/MemoryGrid/MemoryGrid';
import { PathWeaver } from './games/PathWeaver/PathWeaver';
import { MoodMatch } from './games/MoodMatch/MoodMatch';
import { ChronoPulse } from './games/ChronoPulse/ChronoPulse';
import { AviatorCrash } from './games/AviatorCrash/AviatorCrash';

export const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<string>('map');
  
  // 100% fresh in-memory session: All scores and stars start at 0 for every user/refresh
  const [sessionStats] = useState<Record<string, { highLevel: number; stars: number; bestScore: number }>>({
    'matrix-logic': { highLevel: 1, stars: 0, bestScore: 0 },
    'balance-scales': { highLevel: 1, stars: 0, bestScore: 0 },
    'memory-grid': { highLevel: 1, stars: 0, bestScore: 0 },
    'path-weaver': { highLevel: 1, stars: 0, bestScore: 0 },
    'mood-match': { highLevel: 1, stars: 0, bestScore: 0 },
    'chrono-pulse': { highLevel: 1, stars: 0, bestScore: 0 },
    'aviator-crash': { highLevel: 1, stars: 0, bestScore: 0 },
  });

  const handleBackToMap = () => {
    setActiveGame('map');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: activeGame === 'map' ? 'visible' : 'hidden' }}>
        {activeGame === 'map' && (
          <WorldMap
            onSelectGame={(gameId) => setActiveGame(gameId)}
            gameStats={sessionStats}
          />
        )}

        {activeGame === 'matrix-logic' && (
          <MatrixLogic
            onBack={handleBackToMap}
            initialLevel={1}
          />
        )}

        {activeGame === 'balance-scales' && (
          <BalanceLogic
            onBack={handleBackToMap}
            initialLevel={1}
          />
        )}

        {activeGame === 'memory-grid' && (
          <MemoryGrid
            onBack={handleBackToMap}
            initialLevel={1}
          />
        )}

        {activeGame === 'path-weaver' && (
          <PathWeaver
            onBack={handleBackToMap}
            initialLevel={1}
          />
        )}

        {activeGame === 'mood-match' && (
          <MoodMatch
            onBack={handleBackToMap}
            initialLevel={1}
          />
        )}

        {activeGame === 'chrono-pulse' && (
          <ChronoPulse
            onBack={handleBackToMap}
          />
        )}

        {activeGame === 'aviator-crash' && (
          <AviatorCrash
            onBack={handleBackToMap}
          />
        )}
      </main>

      {activeGame === 'map' && (
        <footer
          style={{
            textAlign: 'center',
            padding: '16px',
            color: '#A09687',
            fontSize: '0.85rem',
            fontWeight: 700,
          }}
        >
          GFS &bull; Geeta Finishing School &bull; 10-Question Continuous Analytical Sessions &bull; Zero Data Stored &bull; 100% Private
        </footer>
      )}
    </div>
  );
};

export default App;
