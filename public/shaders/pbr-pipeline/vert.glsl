
out vec3 Normal;

void main()
{
    // Normal = (modelMatrix * vec4(normal, 1)).xyz;
    Normal = mat3(transpose(inverse(modelMatrix))) * normal; 
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
}