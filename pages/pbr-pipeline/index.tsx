import React, { useEffect } from 'react';
import * as THREE from 'three';
import { Vector2, Vector3, Vector4, Matrix4, Light } from "three"
import { loadShaderCode } from "@lib/shaderUtils"
import VectorFields from "@components/VectorFields"

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let mesh: THREE.Mesh;
const material = new THREE.ShaderMaterial({
  lights: true,
  defines: {
    MAX_DIRECTIONAL_LIGHTS: 1
  }
});

const sun = new THREE.DirectionalLight(0xFFFFFF, 1)
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.2)

const init = async () => {
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10)
  camera.position.z = 0.8

  scene = new THREE.Scene()
  scene.add(ambientLight)
  scene.add(sun)

  material.uniforms = {
    ...material.uniforms,
    ...THREE.UniformsLib["lights"],
    directionalLightsCount: { value: 1 }
  }
  material.vertexShader = await loadShaderCode("pbr-pipeline/vert.glsl")
  material.fragmentShader = await loadShaderCode("pbr-pipeline/frag.glsl")


  material.defines = {
    MAX_DIRECTIONAL_LIGHTS: 1
  }
  material.lights = true;

  let geometry = new THREE.SphereGeometry(0.2, 32, 32);
  mesh = new THREE.Mesh(geometry, material);

  scene.add(mesh);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  document.body.appendChild(renderer.domElement);
}

function animation(time) {
  // mesh.rotation.x = time / 2000;
  // mesh.rotation.y = time / 1000;

  renderer.render(scene, camera);
}

export default function PBRPipeline() {
  useEffect(() => {
    init();
  }, [])

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-evenly" }}>
        <VectorFields
          label="Sun Direction"
          dimensions={3}
          vectorType="position"
          inputType="slider"
          defaultValue={new Vector3(0, 1, 0)}
          minValue={-1}
          maxValue={1}
          onChange={pos => {
            sun.position.set(pos.x, pos.y, pos.z);
          }}
        />
        <VectorFields
          label="Sun Color"
          dimensions={3}
          vectorType="color"
          inputType="slider"
          defaultValue={new Vector3(1, 1, 1)}
          minValue={0}
          maxValue={1}
          onChange={color => {
            sun.color.set(new THREE.Color(color.x, color.y, color.z))
          }}
        />
        <VectorFields
          label="Sun Strength"
          dimensions={1}
          vectorType="color"
          inputType="slider"
          defaultValue={0.35}
          minValue={0}
          maxValue={1}
          onChange={value => {
            sun.intensity = value.x;
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-evenly", marginTop: "20px" }}>
        <VectorFields
          label="Ambient Color"
          dimensions={3}
          vectorType="color"
          inputType="slider"
          defaultValue={new Vector3(0.1, 0.1, 0.1)}
          minValue={0}
          maxValue={1}
          onChange={color => {
            ambientLight.color.set(new THREE.Color(color.x, color.y, color.z));
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-evenly", marginTop: "20px" }}>
        <VectorFields
          label="Metallic"
          dimensions={1}
          vectorType="color"
          inputType="slider"
          defaultValue={0}
          minValue={0}
          maxValue={1}
          onChange={value => {
            if (!material.uniforms.metallic)
              material.uniforms.metallic = { value: 0 }
            material.uniforms.metallic.value = value.x
          }}
        />
        <VectorFields
          label="Roughness"
          dimensions={1}
          vectorType="color"
          inputType="slider"
          defaultValue={0.25}
          minValue={0}
          maxValue={1}
          onChange={value => {
            if (!material.uniforms.roughness)
              material.uniforms.roughness = { value: 0 }
            material.uniforms.roughness.value = value.x
            console.log(material.uniforms.roughness.value)
          }}
        />
      </div>
    </div>
  )
}
