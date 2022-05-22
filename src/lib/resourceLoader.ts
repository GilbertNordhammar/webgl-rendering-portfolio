import * as THREE from 'three';

export const loadShaderCode = async (path: string): Promise<string> => {
    const response = await fetch(`shaders/${path}`)
    const shader = await response.text()
    return shader
}

export const loadTexture = async (path: string, showErrors: boolean): Promise<THREE.Texture> => {
    try {
        const loading = new Promise<THREE.Texture>((resolve, reject) => {
            const url = `${window.location.origin}/textures/${path}`
            const loader = new THREE.TextureLoader()
            loader.load(
                url,
                tex => {
                    resolve(tex)
                },
                undefined,
                (err) => {
                    reject(err)
                }
            )
        })

        const texture = await loading
        return texture
    }
    catch (e) {
        if (showErrors) console.error(`Couldn't load texture '${path}'`, e)
    }

}