export function disposeMaterial(material) {
  if (Array.isArray(material)) {
    for (const item of material) {
      disposeMaterial(item);
    }
    return;
  }
  if (material?.map) {
    material.map.dispose();
  }
  if (material?.dispose) {
    material.dispose();
  }
}

export function disposeObject3D(object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      disposeMaterial(child.material);
    }
  });
}
