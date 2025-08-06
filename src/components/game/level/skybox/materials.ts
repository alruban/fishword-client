import {
  Camera,
  DataTexture,
  MathUtils,
  RepeatWrapping,
  ShaderMaterial,
  TextureLoader,
  Uniform,
  Vector2,
  Vector3
} from "three";
import {
  dirToLight,
  rotationMatrix
} from "../skybox/skybox";
import { Random } from "../utilities/random.js";
import Component from '../../world/component';

export default class SkyboxMaterials extends Component {
  public name: string = 'SkyboxMaterials';

  public material = new ShaderMaterial();

  public ditherSize = new Uniform(new Vector2());
  public dither = new Uniform(0) as any;
  public sunVisibility = new Uniform(1);
  public twilightTime = new Uniform(0);
  public twilightVisibility = new Uniform(0);

  public starsSeed = 87;
  public gridSize = 64;
  public starsCount = 10000;
  public maxOffset = 0.43;
  public starsMap = new Uint8Array(this.gridSize * this.gridSize * 24);
  public stars = new Uniform(0) as any;

  public specularVisibility = new Uniform(Math.sqrt(this.sunVisibility.value));
  public light = new Uniform(new Vector3(1, 1, 1));

  public up = new Vector3(0, 1, 0);

  public intensity = 0;
  public l = 0;

  public vertex = /*glsl*/ `
    uniform mat3 _SkyRotationMatrix;

    attribute vec3 coord;

    varying vec3 _worldPos;
    varying vec3 _coord;

    void main() {
      _worldPos = coord;
      _coord = _SkyRotationMatrix * _worldPos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  public fragment = /*glsl*/ `
    #include <skybox>

    varying vec3 _worldPos;
    varying vec3 _coord;

    void main() {
      vec3 worldDir = normalize(_worldPos);
      vec3 viewDir = normalize(_coord);

      float dither = (texture2D(_DitherTexture, (gl_FragCoord.xy - vec2(0.5)) / _DitherTextureSize).x - 0.5) * DITHER_STRENGTH;
      float density = clamp(pow2(1.0 - max(0.0, dot(worldDir, UP) + dither)), 0.0, 1.0);

      float sunLight = dot(viewDir, UP);
      float sun = min(pow(max(0.0, sunLight), SUN_SHARPNESS) * SUN_SIZE, 1.0);

      float moonLight = -sunLight;
      float moon = min(pow(max(0.0, moonLight), MOON_SHARPNESS) * MOON_SIZE, 1.0);

      vec3 day = mix(DAY_SKY_COLOR, DAY_HORIZON_COLOR, density);
      vec3 twilight = mix(LATE_TWILIGHT_COLOR, EARLY_TWILIGHT_COLOR, _TwilightTime);
      vec3 night = mix(NIGHT_SKY_COLOR, NIGHT_HORIZON_COLOR, density);

      vec3 sky = mix(night, day, _SunVisibility);
      sky = mix(sky, twilight, density * clamp(sunLight * 0.5 + 0.5 + dither, 0.0, 1.0) * _TwilightVisibility);

      vec2 cubeCoords = sampleCubeCoords(viewDir);
      vec4 gridValue = texture2D(_Stars, cubeCoords);

      vec2 gridCoords = vec2(cubeCoords.x * _GridSizeScaled, cubeCoords.y * _GridSize);
      vec2 gridCenterCoords = floor(gridCoords) + gridValue.xy;
      float stars = max(min(pow(1.0 - min(distance(gridCoords, gridCenterCoords), 1.0), STARS_SHARPNESS) * gridValue.z * STARS_SIZE, 1.0), moon);
      stars *= min(exp(-dot(sky, vec3(1.0)) * STARS_FALLOFF) * STARS_VISIBILITY, 1.0);

      sky = mix(sky, max(STARS_COLORS[int(gridValue.w * 6.0)], vec3(moon)), stars);
      sky = mix(sky, vec3(1.0), sun);

      gl_FragColor = vec4(sky, 1.0);
    }
  `;


  constructor() {
    super();
  }

  initialise() {
    this.dither.value = new TextureLoader().load("../../../../assets/level/bluenoise.png", (texture) => {
      this.ditherSize.value.x = texture.image.width;
      this.ditherSize.value.y = texture.image.height;
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
    });

    const random = new Random(this.starsSeed);

    for (let i = 0; i < this.starsCount; i++) {
      const a = random.Next() * Math.PI * 2;
      const b = random.Next() * 2 - 1;
      const c = Math.sqrt(1 - b * b);
      const target = new Vector3(Math.cos(a) * c, Math.sin(a) * c, b);
      this.vector3ToStarMap(target, [MathUtils.lerp(0.5 - this.maxOffset, 0.5 + this.maxOffset, random.Next()) * 255, MathUtils.lerp(0.5 - this.maxOffset, 0.5 + this.maxOffset, random.Next()) * 255, Math.pow(random.Next(), 6) * 255, random.Next() * 255]);
    }

    this.stars.value = new DataTexture(this.starsMap, this.gridSize * 6, this.gridSize);
    this.stars.value.needsUpdate = true;

    this.material.vertexShader = this.vertex;
    this.material.fragmentShader = this.fragment;

    this.intensity = dirToLight.dot(this.up);
    this.sunVisibility.value = MathUtils.clamp((this.intensity + 0.1) * 2, 0, 1);
    this.twilightTime.value = MathUtils.clamp((this.intensity + 0.1) * 3, 0, 1);
    this.twilightVisibility.value = 1 - Math.min(Math.abs(this.intensity * 3), 1);

    this.setSkyboxUniforms(this.material);
  }

  public setSkyboxUniforms(material: ShaderMaterial) {
    material.uniforms._SkyRotationMatrix = rotationMatrix;
    material.uniforms._DitherTexture = this.dither;
    material.uniforms._DitherTextureSize = this.ditherSize;
    material.uniforms._SunVisibility = this.sunVisibility;
    material.uniforms._TwilightTime = this.twilightTime;
    material.uniforms._TwilightVisibility = this.twilightVisibility;
    material.uniforms._GridSize = new Uniform(this.gridSize);
    material.uniforms._GridSizeScaled = new Uniform(this.gridSize * 6);
    material.uniforms._Stars = this.stars;
    material.uniforms._SpecularVisibility = this.specularVisibility;
    material.uniforms._DirToLight = new Uniform(dirToLight);
    material.uniforms._Light = this.light;
  }

  async update(deltaTime: number) {
    this.intensity = dirToLight.dot(this.up);
    this.sunVisibility.value = MathUtils.clamp((this.intensity + 0.1) * 2, 0, 1);
    this.twilightTime.value = MathUtils.clamp((this.intensity + 0.1) * 3, 0, 1);
    this.twilightVisibility.value = 1 - Math.min(Math.abs(this.intensity * 3), 1);
    this.specularVisibility.value = Math.sqrt(this.sunVisibility.value);
    this.l = Math.min(this.sunVisibility.value + 0.333, 1);
    this.light.value.set(this.l, this.l, this.l);
  }

  vector3ToStarMap(dir: { x: number; y: number; z: number; }, value: number[]) {
    const absDir = new Vector3(Math.abs(dir.x), Math.abs(dir.y), Math.abs(dir.z));

    const xPositive = dir.x > 0;
    const yPositive = dir.y > 0;
    const zPositive = dir.z > 0;

    let maxAxis = 0;
    let u = 0;
    let v = 0;
    let i = 0;

    if (xPositive && absDir.x >= absDir.y && absDir.x >= absDir.z) {
      maxAxis = absDir.x;
      u = -dir.z;
      v = dir.y;
      i = 0;
    }

    if (!xPositive && absDir.x >= absDir.y && absDir.x >= absDir.z) {
      maxAxis = absDir.x;
      u = dir.z;
      v = dir.y;
      i = 1;
    }

    if (yPositive && absDir.y >= absDir.x && absDir.y >= absDir.z) {
      maxAxis = absDir.y;
      u = dir.x;
      v = -dir.z;
      i = 2;
    }

    if (!yPositive && absDir.y >= absDir.x && absDir.y >= absDir.z) {
      maxAxis = absDir.y;
      u = dir.x;
      v = dir.z;
      i = 3;
    }

    if (zPositive && absDir.z >= absDir.x && absDir.z >= absDir.y) {
      maxAxis = absDir.z;
      u = dir.x;
      v = dir.y;
      i = 4;
    }

    if (!zPositive && absDir.z >= absDir.x && absDir.z >= absDir.y) {
      maxAxis = absDir.z;
      u = -dir.x;
      v = dir.y;
      i = 5;
    }

    u = Math.floor((u / maxAxis + 1) * 0.5 * this.gridSize);
    v = Math.floor((v / maxAxis + 1) * 0.5 * this.gridSize);

    const j = (v * this.gridSize * 6 + i * this.gridSize + u) * 4;

    // @ts-expect-error
    this.starsMap[j] = value[0];
    // @ts-expect-error
    this.starsMap[j + 1] = value[1];
    // @ts-expect-error
    this.starsMap[j + 2] = value[2];
    // @ts-expect-error
    this.starsMap[j + 3] = value[3];
  }
}
