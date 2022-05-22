
out vec3 Normal;
out vec3 WorldPos;
out vec2 FragCoord;

void main()
{
    Normal = mat3(transpose(inverse(modelMatrix))) * normal;
    WorldPos = (modelMatrix * vec4(position, 1)).xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
}