import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BreathingOrb3DProps {
  phase: 'Inhale' | 'Hold' | 'Exhale';
}

export const BreathingOrb3D: React.FC<BreathingOrb3DProps> = ({ phase }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Soft lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const light1 = new THREE.PointLight(0x76d7ea, 2, 10);
    light1.position.set(3, 3, 3);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xd7bde2, 2, 10);
    light2.position.set(-3, -3, 3);
    scene.add(light2);

    // Inner Core Sphere
    const sphereGeo = new THREE.IcosahedronGeometry(1.4, 4);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x48c9b0,
      roughness: 0.15,
      transmission: 0.65,
      thickness: 1.2,
      ior: 1.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Outer Aura Ring / Wireframe Cage
    const cageGeo = new THREE.IcosahedronGeometry(1.65, 2);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0xa3e4d7,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const cage = new THREE.Mesh(cageGeo, cageMat);
    scene.add(cage);

    // Orbiting Dust Motes
    const motesCount = 60;
    const motesGeo = new THREE.BufferGeometry();
    const motesPos = new Float32Array(motesCount * 3);
    for (let i = 0; i < motesCount * 3; i += 3) {
      motesPos[i] = (Math.random() - 0.5) * 6;
      motesPos[i + 1] = (Math.random() - 0.5) * 6;
      motesPos[i + 2] = (Math.random() - 0.5) * 4;
    }
    motesGeo.setAttribute('position', new THREE.BufferAttribute(motesPos, 3));
    const motesMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x76d7ea,
      transparent: true,
      opacity: 0.8,
    });
    const motes = new THREE.Points(motesGeo, motesMat);
    scene.add(motes);

    let animId: number;
    let currentScale = 0.8;
    let targetScale = 0.8;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Dynamic target scale based on phase
      if (phaseRef.current === 'Inhale') {
        targetScale = 1.35;
        sphereMat.color.lerp(new THREE.Color(0x4a90e2), 0.02);
      } else if (phaseRef.current === 'Hold') {
        targetScale = 1.35;
        sphereMat.color.lerp(new THREE.Color(0x9b59b6), 0.02);
      } else {
        targetScale = 0.75;
        sphereMat.color.lerp(new THREE.Color(0x48c9b0), 0.02);
      }

      // Smooth interpolation
      currentScale += (targetScale - currentScale) * 0.025;
      sphere.scale.set(currentScale, currentScale, currentScale);
      cage.scale.set(currentScale * 1.15, currentScale * 1.15, currentScale * 1.15);

      sphere.rotation.y = elapsed * 0.25;
      sphere.rotation.x = elapsed * 0.15;
      cage.rotation.y = -elapsed * 0.15;
      motes.rotation.y = elapsed * 0.05;

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
  }, []);

  return <div ref={mountRef} style={{ width: '320px', height: '320px', margin: '0 auto' }} />;
};
