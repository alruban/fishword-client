import Component from "../../world/component";
import {
  Camera,
  DoubleSide,
  RepeatWrapping,
  ShaderMaterial,
  TextureLoader,
  Uniform,
  Vector3
} from "three";
import EntityManager from "../../world/entityManager";
import SkyboxMaterials from "../skybox/materials";

export default class OceanMaterials extends Component {
  public name: string = 'OceanMaterials';

  public entities: EntityManager;
  public camera: Camera;

  public surface = new ShaderMaterial();
  public volume = new ShaderMaterial();
  public object = new ShaderMaterial();
  public triplanar = new ShaderMaterial();

  public normalMap1 = new Uniform(new TextureLoader().load("../../../../assets/level/waterNormal1.png"));
  public normalMap2 = new Uniform(new TextureLoader().load("../../../../assets/level/waterNormal2.png"));

  public spotLightSharpness = 10;
  public spotLightDistance = 200;
  public spotLightDistanceUniform = new Uniform(this.spotLightDistance);

  public objectTexture = new TextureLoader().load("../../../../assets/level/basicChecker.png");
  public landTexture = new TextureLoader().load("../../../../assets/level/sand.png");

  public blendSharpness = 3;
  public triplanarScale = 1;

  // Shaders
  public surfaceVertex = /*glsl*/ `
    #include <ocean>

    varying vec2 _worldPos;
    varying vec2 _uv;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      _worldPos = worldPos.xz;
      _uv = _worldPos * NORMAL_MAP_SCALE;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  public surfaceFragment = /*glsl*/ `
    #include <ocean>

    varying vec2 _worldPos;
    varying vec2 _uv;

    void main() {
      vec3 viewVec = vec3(_worldPos.x, 0.0, _worldPos.y) - cameraPosition;
      float viewLen = length(viewVec);
      vec3 viewDir = viewVec / viewLen;

      vec3 normal = texture2D(_NormalMap1, _uv + VELOCITY_1 * _Time).xyz * 2.0 - 1.0;
      normal += texture2D(_NormalMap2, _uv + VELOCITY_2 * _Time).xyz * 2.0 - 1.0;
      normal *= NORMAL_MAP_STRENGTH;
      normal += vec3(0.0, 0.0, 1.0);
      normal = normalize(normal).xzy;

      sampleDither(gl_FragCoord.xy);

      if (cameraPosition.y > 0.0) {
        vec3 halfWayDir = normalize(_DirToLight - viewDir);
        float specular = max(0.0, dot(normal, halfWayDir));
        specular = pow(specular, SPECULAR_SHARPNESS) * _SpecularVisibility;

        float reflectivity = pow2(1.0 - max(0.0, dot(-viewDir, normal)));

        vec3 reflection = sampleSkybox(reflect(viewDir, normal));
        vec3 surface = reflectivity * reflection;
        surface = max(surface, specular);

        float fog = clamp(viewLen / FOG_DISTANCE + dither, 0.0, 1.0);
        surface = mix(surface, sampleFog(viewDir), fog);

        gl_FragColor = vec4(surface, max(max(reflectivity, specular), fog));
        return;
      }

      float originY = cameraPosition.y;
      viewLen = min(viewLen, MAX_VIEW_DEPTH);
      float sampleY = originY + viewDir.y * viewLen;
      vec3 light = exp((sampleY - MAX_VIEW_DEPTH_DENSITY) * ABSORPTION);
      light *= _Light;

      float reflectivity = pow2(1.0 - max(0.0, dot(viewDir, normal)));
      float t = clamp(max(reflectivity, viewLen / MAX_VIEW_DEPTH) + dither, 0.0, 1.0);

      if (dot(viewDir, normal) < CRITICAL_ANGLE) {
        vec3 r = reflect(viewDir, -normal);
        sampleY = r.y * (MAX_VIEW_DEPTH - viewLen);
        vec3 rColor = exp((sampleY - MAX_VIEW_DEPTH_DENSITY) * ABSORPTION);
        rColor *= _Light;

        gl_FragColor = vec4(mix(rColor, light, t), 1.0);
        return;
      }

      gl_FragColor = vec4(light, t);
    }
  `;

  public volumeVertex = /*glsl*/ `
    varying vec3 _worldPos;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      _worldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  public volumeFragment = /*glsl*/ `
    #include <ocean>

    varying vec3 _worldPos;

    void main() {
      vec3 viewVec = _worldPos - cameraPosition;
      float viewLen = length(viewVec);
      vec3 viewDir = viewVec / viewLen;
      float originY = cameraPosition.y;

      if (cameraPosition.y > 0.0) {
        float distAbove = cameraPosition.y / -viewDir.y;
        viewLen -= distAbove;
        originY = 0.0;
      }
      viewLen = min(viewLen, MAX_VIEW_DEPTH);

      float sampleY = originY + viewDir.y * viewLen;
      vec3 light = exp((sampleY - viewLen * DENSITY) * ABSORPTION);
      light *= _Light;

      gl_FragColor = vec4(light, 1.0);
    }
  `;

  public objectVertex = /*glsl*/ `
    varying vec3 _worldPos;
    varying vec3 _normal;
    varying vec2 _uv;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      _worldPos = worldPos.xyz;
      _normal = normal;
      _uv = uv;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  public objectFragment = /*glsl*/ `
    #include <ocean>

    uniform vec3 _CameraForward;
    uniform sampler2D _MainTexture;
    uniform float _SpotLightSharpness;
    uniform float _SpotLightDistance;

    varying vec3 _worldPos;
    varying vec3 _normal;
    varying vec2 _uv;

    void main() {
      float dirLighting = max(0.333, dot(_normal, _DirToLight));
      vec3 texture = texture2D(_MainTexture, _uv).xyz * dirLighting;

      vec3 viewVec = _worldPos - cameraPosition;
      float viewLen = length(viewVec);
      vec3 viewDir = viewVec / viewLen;

      if (_worldPos.y > 0.0) {
        if (cameraPosition.y < 0.0) {
          viewLen -= cameraPosition.y / -viewDir.y;
        }

        sampleDither(gl_FragCoord.xy);
        vec3 fogColor = sampleFog(viewDir);
        float fog = clamp(viewLen / FOG_DISTANCE + dither, 0.0, 1.0);
        gl_FragColor = vec4(mix(texture, fogColor, fog), 1.0);
        return;
      }

      float originY = cameraPosition.y;

      if (cameraPosition.y > 0.0) {
        viewLen -= cameraPosition.y / -viewDir.y;
        originY = 0.0;
      }
      viewLen = min(viewLen, MAX_VIEW_DEPTH);

      float sampleY = originY + viewDir.y * viewLen;
      vec3 light = exp((sampleY - viewLen * DENSITY) * ABSORPTION) * _Light;

      float spotLight = 0.0;
      float spotLightDistance = 1.0;
      if (_SpotLightDistance > 0.0) {
        spotLightDistance = min(distance(_worldPos, cameraPosition) / _SpotLightDistance, 1.0);
        spotLight = pow(max(dot(viewDir, _CameraForward), 0.0), _SpotLightSharpness) * (1.0 - spotLightDistance);
      }

      light = min(light + spotLight, vec3(1.0));

      gl_FragColor = vec4(mix(texture * light, light, min(viewLen / MAX_VIEW_DEPTH, 1.0 - spotLight)), 1.0);
    }
  `;

  public triplanarVertex = /*glsl*/ `
    varying vec3 _worldPos;
    varying vec3 _normal;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      _worldPos = worldPos.xyz;
      _normal = normal;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  public triplanarFragment = /*glsl*/ `
    #include <ocean>

    uniform vec3 _CameraForward;
    uniform sampler2D _MainTexture;
    uniform float _BlendSharpness;
    uniform float _Scale;
    uniform float _SpotLightSharpness;
    uniform float _SpotLightDistance;

    varying vec3 _worldPos;
    varying vec3 _normal;

    void main() {
      float dirLighting = max(0.4, dot(_normal, _DirToLight));

      vec3 weights = abs(_normal);
      weights = vec3(pow(weights.x, _BlendSharpness), pow(weights.y, _BlendSharpness), pow(weights.z, _BlendSharpness));
      weights = weights / (weights.x + weights.y + weights.z);

      vec3 textureX = texture2D(_MainTexture, _worldPos.yz * _Scale).xyz * weights.x;
      vec3 textureY = texture2D(_MainTexture, _worldPos.xz * _Scale).xyz * weights.y;
      vec3 textureZ = texture2D(_MainTexture, _worldPos.xy * _Scale).xyz * weights.z;

      vec3 texture = (textureX + textureY + textureZ) * dirLighting;

      vec3 viewVec = _worldPos - cameraPosition;
      float viewLen = length(viewVec);
      vec3 viewDir = viewVec / viewLen;

      if (_worldPos.y > 0.0) {
        if (cameraPosition.y < 0.0) {
          viewLen -= cameraPosition.y / -viewDir.y;
        }

        sampleDither(gl_FragCoord.xy);
        vec3 fogColor = sampleFog(viewDir);
        float fog = clamp(viewLen / FOG_DISTANCE + dither, 0.0, 1.0);
        gl_FragColor = vec4(mix(texture, fogColor, fog), 1.0);
        return;
      }

      float originY = cameraPosition.y;

      if (cameraPosition.y > 0.0) {
        viewLen -= cameraPosition.y / -viewDir.y;
        originY = 0.0;
      }
      viewLen = min(viewLen, MAX_VIEW_DEPTH);

      float sampleY = originY + viewDir.y * viewLen;
      vec3 light = exp((sampleY - viewLen * DENSITY) * ABSORPTION) * _Light;

      float spotLight = 0.0;
      float spotLightDistance = 1.0;
      if (_SpotLightDistance > 0.0) {
        spotLightDistance = min(distance(_worldPos, cameraPosition) / _SpotLightDistance, 1.0);
        spotLight = pow(max(dot(viewDir, _CameraForward), 0.0), _SpotLightSharpness) * (1.0 - spotLightDistance);
      }

      light = min(light + spotLight, vec3(1.0));

      gl_FragColor = vec4(mix(texture * light, light, min(viewLen / MAX_VIEW_DEPTH, 1.0 - spotLight)), 1.0);
    }
  `;

  constructor(entities: EntityManager, camera: Camera) {
    super();

    this.entities = entities;
    this.camera = camera;

    this.normalMap1.value.wrapS = RepeatWrapping;
    this.normalMap1.value.wrapT = RepeatWrapping;
    this.normalMap2.value.wrapS = RepeatWrapping;
    this.normalMap2.value.wrapT = RepeatWrapping;

    this.objectTexture.wrapS = RepeatWrapping;
    this.objectTexture.wrapT = RepeatWrapping;

    this.landTexture.wrapS = RepeatWrapping;
    this.landTexture.wrapT = RepeatWrapping;
  }

  initialise(): void {
    this.surface.vertexShader = this.surfaceVertex;
    this.surface.fragmentShader = this.surfaceFragment;
    this.surface.side = DoubleSide;
    this.surface.transparent = true;

    const skybox = this.entities.get('skybox');
    const cSkyboxMaterials = skybox?.getComponent('SkyboxMaterials') as SkyboxMaterials;

    // TODO: Find time..
    const timeUniform = new Uniform(0);

    // TODO: Camera Forward
    const cameraForward = new Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion); // Camera's 'Forward'

    this.surface.uniforms = {
      _Time: timeUniform,
      _NormalMap1: this.normalMap1,
      _NormalMap2: this.normalMap2
    };
    cSkyboxMaterials.setSkyboxUniforms(this.surface);

    this.volume.vertexShader = this.volumeVertex;
    this.volume.fragmentShader = this.volumeFragment;
    cSkyboxMaterials.setSkyboxUniforms(this.volume);

    this.object.vertexShader = this.objectVertex;
    this.object.fragmentShader = this.objectFragment;
    this.object.uniforms = {
      _MainTexture: new Uniform(this.objectTexture),
      _CameraForward: new Uniform(cameraForward),
      _SpotLightSharpness: new Uniform(this.spotLightSharpness),
      _SpotLightDistance: this.spotLightDistanceUniform
    };
    cSkyboxMaterials.setSkyboxUniforms(this.object);

    this.triplanar.vertexShader = this.triplanarVertex;
    this.triplanar.fragmentShader = this.triplanarFragment;
    this.triplanar.uniforms = {
      _MainTexture: new Uniform(this.landTexture),
      _CameraForward: new Uniform(cameraForward),
      _BlendSharpness: new Uniform(this.blendSharpness),
      _Scale: new Uniform(this.triplanarScale),
      _SpotLightSharpness: new Uniform(this.spotLightSharpness),
      _SpotLightDistance: this.spotLightDistanceUniform
    };
    cSkyboxMaterials.setSkyboxUniforms(this.triplanar);
  }
}
