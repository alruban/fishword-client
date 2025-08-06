import Entity from "./entity";

export default class EntityManager {
  private count: number;
  private entities: Entity[];
  private initialised: string[];

  constructor() {
    this.count = 0;
    this.entities = [];
    this.initialised = [];
  }

  get(name: string): Entity | undefined {
    return this.entities.find(el => el.Name === name);
  }

  add(entity: Entity): void {
    if (!entity.Name) entity.name = `${this.count}`;
    entity.id = this.count;
    this.count++;
    entity.setParent(this);
    this.entities.push(entity);
  }

  remove(departingEntity: string): void {
    this.entities = this.entities.filter(entity => entity.Name !== departingEntity);
    this.initialised = this.initialised.filter(entity => entity !== departingEntity);
  }

  initialise(): void {
    for (const entity of this.entities) {
      if (!entity.Name || this.initialised.includes(entity.Name)) continue; // Skip any already initialised entities.
      this.initialised.push(entity.Name);

      for (const key in entity.components) {
        entity.components[key]?.initialise();
      }
    }
  }

  physicsUpdate(world: any, timeStep: number): void {
    for (const entity of this.entities) {
      entity.physicsUpdate(world, timeStep);
    }
  }

  update(timeElapsed: number): void {
    for (const entity of this.entities) {
      entity.update(timeElapsed);
    }
  }
}
