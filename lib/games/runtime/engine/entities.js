// A tiny entity list: objects with an update function, tags and an optional
// lifetime. Handy for bullets, enemies, pickups and anything spawned over time.
//
//   const entities = createEntities(engine)
//   entities.add(mesh, { tags: ["enemy"], update: (dt, e) => { mesh.position.z += dt }, ttl: 5 })
//   for (const enemy of entities.withTag("enemy")) { ... }
export function createEntities(engine) {
  const list = new Set()

  function add(object, { update, tags = [], data = {}, ttl = null, onRemove } = {}) {
    const entity = { object, update, tags: new Set(tags), data, ttl, onRemove, age: 0, dead: false }
    if (object && !object.parent) engine.scene.add(object)
    list.add(entity)
    return entity
  }

  function remove(entity) {
    if (entity.dead) return
    entity.dead = true
    list.delete(entity)
    entity.object?.removeFromParent()
    entity.onRemove?.(entity)
  }

  engine.onUpdate((dt) => {
    for (const entity of [...list]) {
      if (entity.dead) continue
      entity.age += dt
      entity.update?.(dt, entity)
      if (!entity.dead && entity.ttl != null && entity.age >= entity.ttl) remove(entity)
    }
  }, 10)

  return {
    add,
    remove,
    withTag: (tag) => [...list].filter((e) => e.tags.has(tag)),
    get all() {
      return [...list]
    },
    get count() {
      return list.size
    },
    clear() {
      for (const entity of [...list]) remove(entity)
    },
  }
}
