in vec3 Normal;
in vec3 WorldPos;

// Custom uniforms
uniform float metallic;
uniform float roughness;

uniform int pointLightsCount;

// THREE uniforms
uniform vec3 ambientLightColor;

struct DirectionalLight {
    vec3 direction;
    vec3 color;
};

struct Pointlight {
    vec3 position;
    vec3 color;
    float decay;
    float distance; 
};

uniform DirectionalLight directionalLights[MAX_DIRECTIONAL_LIGHTS];
uniform Pointlight pointLights[1];

const float PI = 3.14159265359;

float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    float a      = roughness*roughness;
    float a2     = a*a;
    float NdotH  = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;
	
    float num   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
	
    return num / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float num   = NdotV;
    float denom = NdotV * (1.0 - k) + k;
	
    return num / denom;
}

float GeometrySmith(vec3 normal, vec3 viewDir, vec3 lightDir, float roughness)
{
    float NdotV = max(dot(normal, viewDir), 0.0);
    float NdotL = max(dot(normal, lightDir), 0.0);
    float ggx2  = GeometrySchlickGGX(NdotV, roughness);
    float ggx1  = GeometrySchlickGGX(NdotL, roughness);
	
    return ggx1 * ggx2;
}

vec3 FresnelSchlick(vec3 halfway, vec3 viewDir, vec3 normalIncidence)
{
    float cosTheta = max(dot(halfway, viewDir), 0.0);
    return normalIncidence + (1.0 - normalIncidence) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

void PBR(out vec3 color, vec3 radianceLight, vec3 lightDir, vec3 viewDir)
{
    vec3 N = normalize(Normal);
    vec3 halfway = normalize(lightDir + viewDir);

    vec3 albedo = vec3(1, 0, 0);
    vec3 normalIncidence = mix(vec3(0.04), albedo, metallic);

    // cook-torrance brdf
    float NDF = DistributionGGX(N, halfway, roughness);        
    float G   = GeometrySmith(N, viewDir, lightDir, roughness);      
    vec3 F    = FresnelSchlick(halfway, viewDir, normalIncidence);     

    vec3 numerator    = NDF * G * F;
    float denominator = 4.0 * max(dot(N, viewDir), 0.0) * max(dot(N, lightDir), 0.0) + 0.0001;
    vec3 specular     = numerator / denominator;

    vec3 diffuse = (vec3(1.0) - F) * (1.0 - metallic);

    color += (diffuse * albedo / PI + specular) * radianceLight * max(0.0, dot(N, lightDir));
}

void main()
{
    vec3 viewDir = normalize(cameraPosition - WorldPos);
    vec3 albedo = vec3(1, 0, 0);

    vec3 color = vec3(0.03) * albedo; // initialize with ambient
    
    // Applying directional light
    PBR(color, directionalLights[0].color, directionalLights[0].direction, viewDir);

    // Applying spotlights
    for(int i = 0; i < pointLightsCount; i++)
    {
        float dist          = length(pointLights[i].position - WorldPos);
        float attenuation   = 1.0 / (dist * dist);
        vec3 radianceLight  = pointLights[i].color * attenuation;
        vec3 lightDir       = normalize(pointLights[i].position - WorldPos);
        PBR(color, radianceLight, lightDir, viewDir);
    }


    // Tone mapping and gamma correction
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));  

    gl_FragColor = vec4(color, 1);
}