import assert from "node:assert/strict";

import { disposeMaterial, disposeObject3D } from "./three-disposal.mjs";

let disposed = 0;
disposeMaterial([
  { dispose: () => { disposed += 1; } },
  {
    map: { dispose: () => { disposed += 1; } },
    dispose: () => { disposed += 1; },
  },
]);
assert.equal(disposed, 3);

let objectDisposed = 0;
const object = {
  traverse(callback) {
    callback({
      geometry: { dispose: () => { objectDisposed += 1; } },
      material: { dispose: () => { objectDisposed += 1; } },
    });
    callback({
      material: [
        { dispose: () => { objectDisposed += 1; } },
        { dispose: () => { objectDisposed += 1; } },
      ],
    });
  },
};

disposeObject3D(object);
assert.equal(objectDisposed, 4);
