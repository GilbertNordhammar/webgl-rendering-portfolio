export const loadShaderCode = async (path: string): Promise<string> => {
    const response = await fetch(`shaders/${path}`);
    const shader = await response.text()
    return shader;
}