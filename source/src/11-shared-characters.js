// Use the same models and animation factories as the published AR book.
const AR_CHARACTER_SOURCE = 'https://mrimagemakers.github.io/NiaNumberGardenAR/';

async function syncGardenCharacters() {
  const models = await import(AR_CHARACTER_SOURCE + 'core.js');
  const swaps = [
    [NIA, models.makeNia], [AR.nia, models.makeNia],
    [ADDIE, models.makeAddie], [FREDDY, models.makeFreddy], [GWENDA, models.makeGwenda],
    [CARLO, models.makeCarlo, -Math.PI / 2], [SUBBY, models.makeSubby, -Math.PI / 2],
    [MILLY, models.makeMilly], [BUTTERFLY, models.makeButterfly8], [SKIPPY, models.makeSkippy]
  ];
  const meshes = new Set(['nia', 'addie', 'freddy', 'gwenda']);
  const imported = models.loadModels();

  await Promise.all(swaps.map(async ([character, makeModel, yaw = 0]) => {
    const { key, height } = character.userData;
    try {
      if (meshes.has(key) && !(await imported)[key]) return;

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
    } catch (error) {
      console.warn('Could not load shared garden character:', key, error);
    }
  }));
}

syncGardenCharacters().catch(error => console.warn('Could not load shared garden characters:', error));
