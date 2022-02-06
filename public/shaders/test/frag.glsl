in vec3 Normal;

uniform vec3 lightDir;
uniform vec3 lightColor;
uniform float lightStrength;

void main()
{
    float diffuse = dot(Normal, normalize(lightDir));
    //diffuse = clamp(diffuse, 0.0, 1.0);
    vec3 color = lightColor * diffuse * lightStrength;
    gl_FragColor = vec4(color,1);
}