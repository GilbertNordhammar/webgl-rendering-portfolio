out vec3 Normal;
out vec3 WorldPos;
out vec2 FragCoord;
out mat3 TBN;

void main()
{
    mat3 normalMatrix = transpose(inverse(mat3(modelMatrix)));
    Normal = normalMatrix * normal;
    WorldPos = (modelMatrix * vec4(position, 1)).xyz;
    FragCoord = uv;

    vec3 Tangent = normalize(normalMatrix * tangent.xyz);
    
    // re-orthogonalize T with respect to Normal
    Tangent = normalize(Tangent - dot(Tangent, Normal) * Normal);
    vec3 Bitangent = cross(Normal, Tangent);

    TBN = mat3(Tangent, Bitangent, Normal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
}