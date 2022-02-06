import React, { useEffect } from 'react';
import * as THREE from 'three';
import { Vector2, Vector3, Vector4 } from "three"
import { loadShaderCode } from "@lib/shaderUtils"
import VectorFields from "@components/VectorFields"

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let mesh: THREE.Mesh;
let material: THREE.ShaderMaterial

const init = async () => {
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
  camera.position.z = 1;

  scene = new THREE.Scene();

  let geometry = new THREE.SphereGeometry(0.1, 32, 16);

  let vertexShader: string = await loadShaderCode("test/vert.glsl");
  let fragmentShader: string = await loadShaderCode("test/frag.glsl");

  material = new THREE.ShaderMaterial({
    uniforms: {
      lightDir: { value: new Vector3(0.0, -0.5, 0.5) },
      lightColor: { value: new Vector3(1.0, 1.0, 1.0) },
      lightStrength: { value: 1 }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });

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

export default function Test() {
  useEffect(() => {
    init();
  }, [])

  return (
    <div style={{ display: "flex", justifyContent: "space-evenly" }}>
      <VectorFields
        label="Light Direction"
        dimensions={3}
        vectorType="position"
        inputType="slider"
        defaultValue={new Vector3(0.0, -0.5, 0.5)}
        minValue={-1}
        maxValue={1}
        onChange={value => {
          if (material)
            material.uniforms.lightDir.value = new Vector3(...value)
        }}
      />
      <VectorFields
        label="Light Color"
        dimensions={3}
        vectorType="color"
        inputType="slider"
        defaultValue={new Vector3(1.0, 1.0, 1.0)}
        minValue={0}
        maxValue={1}
        onChange={value => {
          if (material)
            material.uniforms.lightColor.value = new Vector3(...value)
        }}
      />

      <VectorFields
        label="Light Strength"
        dimensions={1}
        vectorType="color"
        inputType="slider"
        defaultValue={1}
        minValue={0}
        maxValue={5}
        onChange={value => {
          if (material)
            material.uniforms.lightStrength.value = value.x
        }}
      />
    </div>
  )
}
