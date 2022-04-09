in vec3 Normal;

// Custom uniforms
uniform float sunStrength;

// THREE uniforms
uniform vec3 ambientLightColor;

struct DirectionalLight {
    vec3 direction;
    vec3 color;
};

uniform DirectionalLight directionalLights[ MAX_DIRECTIONAL_LIGHTS ];

void main()
{
    float diffuse = max(0.0, dot(normalize(Normal), normalize(directionalLights[0].direction)));
    vec3 color = directionalLights[0].color * diffuse * sunStrength;
    color += ambientLightColor;
    gl_FragColor = vec4(color, 1);
}