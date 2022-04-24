import React, { useEffect, useState, useReducer } from 'react';
import * as THREE from 'three';
import { Vector2, Vector3, Vector4, Matrix4, Light, Scene, Camera, Object3D } from "three"
import { loadShaderCode } from "@lib/shaderUtils"
import VectorFields from "@components/VectorFields"

const MAX_DIRECTIONAL_LIGHTS = 1
const MAX_POINT_LIGHTS = 4

let g_Scene: THREE.Scene;
let g_Camera: THREE.PerspectiveCamera;
let g_Renderer: THREE.WebGLRenderer;
let g_Mesh: THREE.Mesh;
const g_Material = new THREE.ShaderMaterial({
  lights: true,
  defines: {
    MAX_DIRECTIONAL_LIGHTS,
    MAX_POINT_LIGHTS
  }
});

const g_Sun = new THREE.DirectionalLight(0xFFFFFF, 1)
const g_AmbientLight = new THREE.AmbientLight(0xFFFFFF, 0.2)
const g_Pointlights: THREE.PointLight[] = []
const g_DirectionalLights: THREE.DirectionalLight[] = []

const g_PointlightsMeshes: THREE.Mesh[] = []

const init = async () => {
  g_Camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100)
  g_Camera.position.z = 40

  g_Scene = new THREE.Scene()

  g_Material.uniforms = {
    ...g_Material.uniforms,
    ...THREE.UniformsLib["lights"],
    directionalLightsCount: { value: 0 },
    pointLightsCount: { value: 0 },
    viewMatrixInverse: { value: g_Camera.matrixWorldInverse }
  }
  g_Material.vertexShader = await loadShaderCode("pbr-pipeline/vert.glsl")
  g_Material.fragmentShader = await loadShaderCode("pbr-pipeline/frag.glsl")

  let geometry = new THREE.SphereGeometry(10, 32, 32);
  g_Mesh = new THREE.Mesh(geometry, g_Material);

  // Adding meshes
  g_Scene.add(g_Mesh);

  // Adding lights
  g_Scene.add(g_AmbientLight)

  addLight(g_Sun, g_Scene, [g_Material])

  const pointlight = new THREE.PointLight(0xFFFFFF, 1, 100)
  pointlight.position.set(12, 2, 0)
  addLight(pointlight, g_Scene, [g_Material])

  g_Renderer = new THREE.WebGLRenderer({ antialias: true });
  g_Renderer.setSize(window.innerWidth, window.innerHeight);
  g_Renderer.setAnimationLoop(animation);
  document.body.appendChild(g_Renderer.domElement);
}

const addLight = (
  light: THREE.PointLight | THREE.DirectionalLight,
  scene: THREE.Scene,
  materials: THREE.ShaderMaterial[]
) => {
  let tooManyLights = false;

  if (light instanceof THREE.PointLight) {
    if (g_Pointlights.length + 1 <= MAX_POINT_LIGHTS) {
      g_Pointlights.push(light)

      materials.forEach(mat => {
        if (!mat.uniforms.pointLightsCount)
          mat.uniforms.pointLightsCount = { value: 0 }
        mat.uniforms.pointLightsCount.value = g_Pointlights.length
      })

      const geometry = new THREE.SphereGeometry(1, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(light.position)
      scene.add(sphere)
      g_PointlightsMeshes.push(sphere)
    }
    else {
      tooManyLights = true;
      console.log(`Too many pointlights! Maximum amount is ${MAX_POINT_LIGHTS}`)
    }
  }
  else if (light instanceof THREE.DirectionalLight) {
    if (g_DirectionalLights.length + 1 <= MAX_DIRECTIONAL_LIGHTS) {
      g_DirectionalLights.push(light)

      materials.forEach(mat => {
        if (!mat.uniforms.directionalLightsCount)
          mat.uniforms.directionalLightsCount = { value: 0 }
        mat.uniforms.directionalLightsCount.value = g_DirectionalLights.length
      })
    }
    else {
      tooManyLights = true;
      console.log(`Too many directional lights! Maximum amount is ${MAX_DIRECTIONAL_LIGHTS}`)
    }
  }

  if (!tooManyLights)
    scene.add(light)
}

const movePointLight = (index: number, position: Vector3) => {
  g_Pointlights[index].position.copy(position)
  g_PointlightsMeshes[index].position.copy(position)
}

const rotateAround = (rotatee: Object3D, origin: Vector3, up: Vector3, mouseMovement: Vector2) => {
  const originalDist = rotatee.position.distanceTo(origin)

  const right = new Vector3
  right.crossVectors(rotatee.getWorldDirection(origin), new Vector3(0, 1, 0))
  right.multiplyScalar(mouseMovement.x)

  rotatee.position.add(right)
  rotatee.position.y += mouseMovement.y;
  rotatee.lookAt(origin)

  const movement = new Vector3()
  movement.copy(rotatee.getWorldDirection(origin))
  movement.multiplyScalar(-originalDist)

  rotatee.position.copy(origin)
  rotatee.position.add(movement)
}

const animation = (time) => {

  g_Pointlights.forEach((pointLight, index) => {
    const pos = new Vector3(pointLight.position.x, Math.sin(time / 1000) * 10, pointLight.position.z)
    movePointLight(index, pos)
  })

  g_Material.uniforms.viewMatrixInverse = { value: g_Camera.matrixWorld }

  g_Renderer.render(g_Scene, g_Camera);
}

export default function PBRPipeline() {
  const [initialized, setInitialized] = useState(false)
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    document.addEventListener("initialized", () => setInitialized(true))

    init().then(() => {
      setInitialized(true)
      forceUpdate()
    })

    let altDown = false;
    let rotateCamera = false;
    window.addEventListener('mousemove', e => {
      if (!rotateCamera || !altDown)
        return

      const xDir = e.movementX > 0 ? -1 : 1;
      const yDir = e.movementY > 0 ? -1 : 1;
      const movement = new Vector2(xDir * 5, 0);
      rotateAround(g_Camera, g_Mesh.position, new Vector3(0, 1, 0), movement)
    });
    window.addEventListener('mousedown', e => {
      if (altDown) {
        document.body.requestPointerLock();
        rotateCamera = true;
      }
    });
    window.addEventListener('mouseup', e => {
      document.exitPointerLock();
      rotateCamera = false;
    });
    window.addEventListener("keydown", e => {
      if (e.key == "Alt" && !altDown)
        altDown = true;
    })
    window.addEventListener("keyup", e => {
      altDown = false;
    })
  }, [])

  const page = <div>
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
          g_Sun.position.set(pos.x, pos.y, pos.z);
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
          g_Sun.color.set(new THREE.Color(color.x, color.y, color.z))
        }}
      />
      <VectorFields
        label="Sun Intensity"
        dimensions={1}
        vectorType="color"
        inputType="slider"
        defaultValue={0.35}
        minValue={0}
        maxValue={1}
        onChange={value => {
          g_Sun.intensity = value.x;
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
          g_AmbientLight.color.set(new THREE.Color(color.x, color.y, color.z));
        }}
      />
      <VectorFields
        label="Pointlight Intensity"
        dimensions={1}
        vectorType="color"
        inputType="slider"
        defaultValue={200}
        minValue={0}
        maxValue={500}
        onChange={value => {
          g_Pointlights.forEach(light => light.intensity = value.x)
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
          if (!g_Material.uniforms.metallic)
            g_Material.uniforms.metallic = { value: 0 }
          g_Material.uniforms.metallic.value = value.x
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
          if (!g_Material.uniforms.roughness)
            g_Material.uniforms.roughness = { value: 0 }
          g_Material.uniforms.roughness.value = value.x
        }}
      />
    </div>
  </div>

  return (
    initialized && page
  )
}
