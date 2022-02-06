
out vec3 Normal;

void main()
{
    Normal = (modelViewMatrix * vec4(normal, 1)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
}