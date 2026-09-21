import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CrystalGrid3DProps {
  activeCount: number;
  colorHex?: string;
}

export const CrystalGrid3D: React.FC<CrystalGrid3DProps> = ({
  colorHex = '#3CA2FF',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = 120;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.2, 10);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // 3 Floating rotating crystals in a showcase row
    const crystals: THREE.Mesh[] = [];
    const colors = [0x3ca2ff, 0x38b07d, 0xf5a623];
    const geos = [
      new THREE.OctahedronGeometry(0.65, 0),
      new THREE.IcosahedronGeometry(0.7, 0),
      new THREE.TetrahedronGeometry(0.6, 0),
    ];

    [-1.6, 0, 1.6].forEach((xPos, idx) => {
      const mat = new THREE.MeshStandardMaterial({
        color: colors[idx],
        roughness: 0.2,
        metalness: 0.1,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(geos[idx], mat);
      mesh.position.set(xPos, 0, 0);
      scene.add(mesh);
      crystals.push(mesh);
    });

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      crystals.forEach((c, idx) => {
        c.rotation.y = elapsed * (0.6 + idx * 0.2);
        c.rotation.x = elapsed * 0.4;
        c.position.y = Math.sin(elapsed * 2 + idx) * 0.15;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [colorHex]);

  return <div ref={mountRef} style={{ width: '100%', height: '120px', margin: '0 auto' }} />;
};
