import * as THREE from 'three';
import { Camera } from 'three';

export interface PBRShaderMaterialParameters extends THREE.ShaderMaterialParameters {
    sourceMaterial?: THREE.MeshStandardMaterial,
}

export class PBRShaderMaterial extends THREE.ShaderMaterial {
    constructor(parameters?: PBRShaderMaterialParameters) {
        super(parameters)

        this.lights = true
        this.defines = {
            MAX_DIRECTIONAL_LIGHTS: 1,
            MAX_POINT_LIGHTS: 4,
            // USE_TANGENT: true
        }
        this.uniforms = {
            ...THREE.UniformsLib["lights"],
            directionalLightsCount: { value: 0 },
            pointLightsCount: { value: 0 }
        }

        if (parameters && parameters.sourceMaterial) {
            this.copyPBRProperties(parameters.sourceMaterial)
        }
        else {
            this.uniforms = {
                ...this.uniforms,

                // PBR textures
                albedoMap: { value: undefined },
                metalnessMap: { value: undefined },
                normalMap: { value: undefined },
                roughnessMap: { value: undefined },
                ambientOcclusionMap: { value: undefined },
                bumpMap: { value: undefined },

                // PBR multipliers
                metalnessScale: { value: 1 },
                normalScale: { value: 1 },
                roughnessScale: { value: 1 },
                amibentOcclusionScale: { value: 1 },
                bumpScale: { value: 1 }
            }
        }
    }

    copyPBRProperties(material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial) {
        this.uniforms = {
            ...this.uniforms,

            // PBR textures
            albedoMap: { value: material.map },
            metalnessMap: { value: material.metalnessMap },
            normalMap: { value: material.normalMap },
            roughnessMap: { value: material.roughnessMap },
            ambientOcclusionMap: { value: material.aoMap },
            bumpMap: { value: material.bumpMap },

            // PBR multipliers
            metalnessScale: { value: material.metalness },
            normalScale: { value: material.normalScale },
            roughnessScale: { value: material.roughness },
            amibentOcclusionScale: { value: material.aoMapIntensity },
            bumpScale: { value: material.bumpScale }
        }
    }

    // Albedo
    set albedoMap(albedoMap: THREE.Texture) {
        this.uniforms.albedoMap.value = albedoMap
    }

    get albedoMap(): THREE.Texture | undefined {
        return this.uniforms.albedoMap.value
    }

    // Metal
    set metalnessMap(metalnessMap: THREE.Texture) {
        this.uniforms.metalnessMap.value = metalnessMap
    }

    get metalnessMap(): THREE.Texture | undefined {
        return this.uniforms.metalnessMap.value
    }

    get metalnessScale(): number {
        return this.uniforms.metalnessScale.value
    }

    set metalnessScale(value: number) {
        this.uniforms.metalnessScale.value = value > 0 ? value : 0
    }

    // Normal
    set normalMap(normalMap: THREE.Texture) {
        this.uniforms.normalMap.value = normalMap
    }

    get normalMap(): THREE.Texture | undefined {
        return this.uniforms.normalMap.value
    }

    get normalMapScale(): number {
        return this.uniforms.normalMapScale.value
    }

    set normalMapScale(value: number) {
        this.uniforms.normalMapScale.value = value > 0 ? value : 0
    }

    // Roughness
    set roughnessMap(roughnessMap: THREE.Texture) {
        this.uniforms.roughnessMap.value = roughnessMap
    }

    get roughnessMap(): THREE.Texture | undefined {
        return this.uniforms.roughnessMap.value
    }

    get roughnessScale(): number {
        return this.uniforms.roughnessScale.value
    }

    set roughnessScale(value: number) {
        this.uniforms.roughnessScale.value = value > 0 ? value : 0
    }

    // Ambient Occlusion
    set ambientOcclusionMap(aoMap: THREE.Texture) {
        this.uniforms.ambientOcclusionMap.value = aoMap
    }

    get ambientOcclusionMap(): THREE.Texture | undefined {
        return this.uniforms.ambientOcclusionMap.value
    }

    get ambientOcclusionScale(): number {
        return this.uniforms.ambientOcclusionScale.value
    }

    set ambientOcclusionScale(value: number) {
        this.uniforms.ambientOcclusionScale.value = value > 0 ? value : 0
    }

    // Private variables
    private m_Camera: Camera
}