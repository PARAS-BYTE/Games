import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface RulePedestal3DProps {
  currentShape?: 'circle' | 'triangle' | 'square' | 'star';
  currentColor?: 'coral' | 'mint' | 'sky' | 'sun';
  isAccepted?: boolean | null;
}

const COLOR_MAP: Record<string, number> = {
  coral: 0xff6565,
  mint: 0x38b07d,
  sky: 0x3ca2ff,
  sun: 0xf5a623,
};

export const RulePedestal3D: React.FC<RulePedestal3DProps> = ({
  currentShape = 'star',
  currentColor = 'sun',
  isAccepted = null,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const glowLightRef = useRef<THREE.PointLight | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = 180;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.8, 4.8);
    camera.lookAt(0, 0.2, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Warm Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffae6, 1.2);
    dirLight.position.set(3, 5, 3);
    scene.add(dirLight);

    const glowLight = new THREE.PointLight(0xffffff, 0, 6);
    glowLight.position.set(0, 1.2, 0);
    scene.add(glowLight);
    glowLightRef.current = glowLight;

    // 3D Pedestal Base (Circular marble platform)
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.35, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xf0eae1,
      roughness: 0.3,
      metalness: 0.1,
    });
    const pedestal = new THREE.Mesh(baseGeo, baseMat);
    pedestal.position.set(0, -0.6, 0);
    scene.add(pedestal);

    // Floating 3D Geometric Shape
    let geo: THREE.BufferGeometry;
    if (currentShape === 'circle') {
      geo = new THREE.SphereGeometry(0.75, 32, 32);
    } else if (currentShape === 'triangle') {
      geo = new THREE.ConeGeometry(0.8, 1.2, 3);
    } else if (currentShape === 'square') {
      geo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    } else {
      // Star / Octahedron
      geo = new THREE.OctahedronGeometry(0.85, 0);
    }

    const hex = COLOR_MAP[currentColor] || 0xf5a623;
    const mat = new THREE.MeshStandardMaterial({
      color: hex,
      roughness: 0.25,
      metalness: 0.15,
      flatShading: currentShape === 'triangle' || currentShape === 'star',
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 0.5, 0);
    scene.add(mesh);
    meshRef.current = mesh;

    // Status beam ring when tested
    const ringGeo = new THREE.TorusGeometry(1.2, 0.05, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38b07d,
      transparent: true,
      opacity: 0,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, -0.4, 0);
    scene.add(ring);

    if (isAccepted === true) {
      glowLight.color.setHex(0x38b07d);
      glowLight.intensity = 2.5;
      ringMat.color.setHex(0x38b07d);
      ringMat.opacity = 0.8;
    } else if (isAccepted === false) {
      glowLight.color.setHex(0xff6565);
      glowLight.intensity = 2.0;
      ringMat.color.setHex(0xff6565);
      ringMat.opacity = 0.8;
    }

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (mesh) {
        mesh.rotation.y = elapsed * 0.9;
        mesh.rotation.x = currentShape === 'triangle' ? 0 : elapsed * 0.4;
        mesh.position.y = 0.5 + Math.sin(elapsed * 2.2) * 0.12;
      }

      pedestal.rotation.y = elapsed * 0.08;

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
  }, [currentShape, currentColor, isAccepted]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        maxWidth: '320px',
        height: '180px',
        margin: '0 auto',
      }}
    />
  );
};
