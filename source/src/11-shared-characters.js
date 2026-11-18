// These assets are packaged with the world so the AR site can be deployed independently.

async function syncGardenCharacters() {
  const models = await import('./assets/number-garden-characters/core.js');
  const swaps = [
    [NIA, models.makeNia], [AR.nia, models.makeNia],
    [ADDIE, models.makeAddie], [FREDDY, models.makeFreddy], [GWENDA, models.makeGwenda],
    [CARLO, models.makeCarlo, -Math.PI / 2], [SUBBY, models.makeSubby, -Math.PI / 2],
    [MILLY, models.makeMilly], [BUTTERFLY, models.makeButterfly8], [SKIPPY, models.makeSkippy]
  ];
  const meshes = new Set(['nia', 'addie', 'freddy', 'gwenda']);
  const imported = models.loadModels();

  const results = await Promise.all(swaps.map(async ([character, makeModel, yaw = 0]) => {
    const { key, height } = character.userData;
    try {
      if (meshes.has(key) && !(await imported)[key]) return false;

      const model = makeModel();
      model.rotation.y = yaw;
      const bounds = new THREE.Box3().setFromObject(model, true);
      const size = bounds.getSize(new THREE.Vector3());
      if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('Invalid character bounds');
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = height / size.y;
      model.scale.multiplyScalar(scale);
      model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      character.userData.setModel(model);
      return true;
    } catch (error) {
      console.warn('Could not load shared garden character:', key, error);
      return false;
    }
  }));
  return results.every(Boolean);
}

const castStatus = document.getElementById('cast-status');
const charactersReady = syncGardenCharacters().catch(error => {
  console.warn('Could not load shared garden characters:', error);
  return false;
});
charactersReady.then(loaded => {
  castStatus.textContent = loaded ? 'Updated characters ready' : 'Some updated characters failed to load. Reload to try again.';
  castStatus.dataset.state = loaded ? 'ready' : 'fallback';
});
const allowGardenEntry = new Promise(resolve => {
  const timeout = setTimeout(() => {
    castStatus.textContent = 'Some updated characters are still loading.';
    resolve();
  }, 20000);
  charactersReady.then(() => {
    clearTimeout(timeout);
    resolve();
  });
});
Promise.all([gardenSceneReady, allowGardenEntry]).then(markReady);
