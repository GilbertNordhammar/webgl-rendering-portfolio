import React, { useEffect } from 'react';
import * as THREE from 'three';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let geometry: THREE.BoxGeometry;
let material: THREE.MeshNormalMaterial;
let mesh: THREE.Mesh;

function init() {
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
  camera.position.z = 1;

  scene = new THREE.Scene();

  geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  material = new THREE.MeshNormalMaterial();

  // const m = new THREE.ShaderMaterial( {

  //   uniforms: {

  //     time: { value: 1.0 },
  //     resolution: { value: new THREE.Vector2() }

  //   },

  //   vertexShader: document.getElementById( 'vertexShader' ).textContent,

  //   fragmentShader: document.getElementById( 'fragmentShader' ).textContent

  // } );

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  document.body.appendChild(renderer.domElement);

}

function animation(time) {

  mesh.rotation.x = time / 2000;
  mesh.rotation.y = time / 1000;

  renderer.render(scene, camera);

}

export default function Home() {
  useEffect(() => {
    init();
  })

  return (
    <></>
  )
}
