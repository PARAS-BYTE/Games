import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const HeroScene3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 220;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Warm Ambient and Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffae6, 1.2);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const backLight = new THREE.PointLight(0x76d7ea, 0.8, 10);
    backLight.position.set(-4, -2, -2);
    scene.add(backLight);

    // Floating 3D Geometric Gems (Kid-friendly pastel polyhedra)
    const gemGroup = new THREE.Group();
    scene.add(gemGroup);

    // 1. Center Floating Octahedron (Sun Gold)
    const geo1 = new THREE.OctahedronGeometry(1.2, 0);
    const mat1 = new THREE.MeshStandardMaterial({
      color: 0xf5a623,
      roughness: 0.25,
      metalness: 0.15,
      flatShading: true,
    });
    const mesh1 = new THREE.Mesh(geo1, mat1);
    mesh1.position.set(0, 0.2, 0);
    gemGroup.add(mesh1);

    // 2. Left Floating Icosahedron (Mint Green)
    const geo2 = new THREE.IcosahedronGeometry(0.8, 0);
    const mat2 = new THREE.MeshStandardMaterial({
      color: 0x38b07d,
      roughness: 0.3,
      metalness: 0.1,
      flatShading: true,
    });
    const mesh2 = new THREE.Mesh(geo2, mat2);
    mesh2.position.set(-2.6, -0.4, -0.5);
    gemGroup.add(mesh2);

    // 3. Right Floating Dodecahedron (Lavender)
    const geo3 = new THREE.DodecahedronGeometry(0.85, 0);
    const mat3 = new THREE.MeshStandardMaterial({
      color: 0x9b59b6,
      roughness: 0.2,
      metalness: 0.2,
      flatShading: true,
    });
    const mesh3 = new THREE.Mesh(geo3, mat3);
    mesh3.position.set(2.6, 0.4, -0.4);
    gemGroup.add(mesh3);

    // 4. Tiny Floating Coral Diamond
    const geo4 = new THREE.TetrahedronGeometry(0.5, 0);
    const mat4 = new THREE.MeshStandardMaterial({
      color: 0xff6565,
      roughness: 0.2,
      flatShading: true,
    });
    const mesh4 = new THREE.Mesh(geo4, mat4);
    mesh4.position.set(-1.4, 1.3, 0.5);
    gemGroup.add(mesh4);

    // Orbiting Stardust Particles
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 45;
    const posArr = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArr[i] = (Math.random() - 0.5) * 8;
      posArr[i + 1] = (Math.random() - 0.5) * 4;
      posArr[i + 2] = (Math.random() - 0.5) * 4;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.09,
      color: 0xf5a623,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle tumbling rotations
      mesh1.rotation.y = elapsed * 0.55;
      mesh1.rotation.x = elapsed * 0.35;
      mesh1.position.y = 0.2 + Math.sin(elapsed * 1.5) * 0.15;

      mesh2.rotation.y = -elapsed * 0.45;
      mesh2.rotation.z = elapsed * 0.3;
      mesh2.position.y = -0.4 + Math.sin(elapsed * 1.8 + 1) * 0.18;

      mesh3.rotation.x = elapsed * 0.4;
      mesh3.rotation.y = elapsed * 0.5;
      mesh3.position.y = 0.4 + Math.sin(elapsed * 1.4 + 2) * 0.16;

      mesh4.rotation.y = elapsed * 0.8;
      mesh4.position.y = 1.3 + Math.sin(elapsed * 2.2) * 0.12;

      // Parallax with mouse
      gemGroup.rotation.y += (mouseX * 0.4 - gemGroup.rotation.y) * 0.05;
      gemGroup.rotation.x += (-mouseY * 0.25 - gemGroup.rotation.x) * 0.05;

      particles.rotation.y = elapsed * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '240px',
        position: 'relative',
        cursor: 'grab',
        touchAction: 'none',
      }}
    />
  );
};
