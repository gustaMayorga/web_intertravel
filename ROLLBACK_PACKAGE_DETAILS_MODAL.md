## Rollback Instructions for PackageDetailsModal.jsx Debugging

To revert the debugging changes made to `frontend/src/components/PackageDetailsModal.jsx`, follow these steps:

1.  **Remove `console.log` from `renderTabContent` function:**

    Locate the following code block:
    ```javascript
    if (!packageData) {
      console.log('packageData is null or undefined in renderTabContent');
      return null;
    }

    console.log('packageData in renderTabContent:', packageData);
    switch (activeTab) {
    ```
    And replace it with:
    ```javascript
    if (!packageData) return null;

    switch (activeTab) {
    ```

2.  **Remove `console.error` from `fetchPackageDetails` function:**

    Locate the following line within the `catch` block of `fetchPackageDetails`:
    ```javascript
    console.error('Error completo:', err);
    ```
    And delete it.

## Rollback Instructions for backend/server.js (Mock Package Data)

To revert the changes made to `backend/server.js` regarding the mock package data, locate the `generateMockPackages` function and specifically the `intertravelPackages` array. Revert the addition of the test package with ID `29348135`.

**Original `intertravelPackages` array (before adding the test package):**

```javascript
  const intertravelPackages = [
    {
      name: 'Mendoza Premium Wine Tour - InterTravel',
      country: 'Argentina',
      price: 2890,
      category: 'Lujo',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      externalReference: 'intertravel-mendoza-premium-001',
      provider: 'InterTravel',
      _isIntertravel: true
    },
    {
      name: 'Exclusive Patagonia Adventure - enzo.vingoli',
      country: 'Argentina',
      price: 3490,
      category: 'Aventura',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop',
      externalReference: 'vingoli-patagonia-exclusive-002',
      provider: 'enzo.vingoli',
      _isIntertravel: true
    },
    {
      name: 'VIP Buenos Aires Experience - InterTravel',
      country: 'Argentina',
      price: 1990,
      category: 'Ciudad',
      image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&h=600&fit=crop',
      externalReference: 'intertravel-baires-vip-003',
      provider: 'InterTravel',
      _isIntertravel: true
    },
    {
      name: 'Luxury Wine & Spa Retreat - InterTravel',
      country: 'Argentina',
      price: 4290,
      category: 'Relax',
      image: 'https://images.unsplash.com/photo-1560869713-bf4b9b1b9b6c?w=800&h=600&fit=crop',
      externalReference: 'intertravel-wine-spa-004',
      provider: 'InterTravel',
      _isIntertravel: true
    }
  ];
```

To revert the change that ensures the specific ID is used:

Locate the following code block in `generateMockPackages`:
```javascript
    const intertravelPkg = intertravelPackages[i % intertravelPackages.length];
    const id = intertravelPkg.id || `IT${27000 + i}`;
    const duration = [7, 10, 14][i % 3];
    
    packages.push({
      id: id,
```
And replace it with:
```javascript
    const intertravelPkg = intertravelPackages[i % intertravelPackages.length];
    const id = `IT${27000 + i}`;
    const duration = [7, 10, 14][i % 3];
    
    packages.push({
      id: id,
```

## Rollback Instructions for backend/server.js (API Package Details Logging)

To revert the logging changes made to the `/api/packages/:id` route in `backend/server.js`:

1.  **Remove `console.log` for cache status:**

    Locate:
    ```javascript
    console.log(`Cache para ${id}:`, cachedPackage ? 'ENCONTRADO' : 'NO ENCONTRADO');
    ```
    And delete it.

2.  **Remove `console.log` for TC result:**

    Locate:
    ```javascript
    console.log(`Resultado de TC para ${id}:`, result);
    ```
    And delete it.

3.  **Remove `console.log` for mock package found status:**

    Locate:
    ```javascript
    console.log(`Paquete ${id} encontrado en mocks:`, packageFound ? 'SÍ' : 'NO');
    ```
    And delete it.

## Rollback Instructions for backend/travel-compositor-fast.js (getPackageDetails Logging)

To revert the logging changes made to the `getPackageDetails` function in `backend/travel-compositor-fast.js`:

1.  **Remove `console.log` for packageId request:**

    Locate:
    ```javascript
    console.log(`[TC-DETAILS] Solicitando URL: ${url}`);
    ```
    And delete it.

2.  **Remove `console.log` for API response data:**

    Locate:
    ```javascript
    console.log(`[TC-DETAILS] Respuesta exitosa para ${packageId}:`, response.data);
    ```
    And delete it.

3.  **Remove `console.error` for error status and data:**

    Locate:
    ```javascript
    if (error.response) {
        console.error(`[TC-DETAILS] Status: ${error.response.status}`);
        console.error(`[TC-DETAILS] Data:`, error.response.data);
    }
    ```
    And delete it.

## Rollback Instructions for backend/travel-compositor-fast.js (Raw TC Package Data Logging)

To revert the logging changes made to the `getHolidayPackagesPage` function in `backend/travel-compositor-fast.js`:

Locate:
```javascript
        console.log('Raw TC package data example:', response.data.package[0]); // Log first package for inspection
```
And delete it.

## Rollback Instructions for backend/travel-compositor-fast.js (normalizePackage ID extraction - providerCode)

To revert the changes made to the `normalizePackage` function in `backend/travel-compositor-fast.js`:

Locate the following code block:
```javascript
      id: pkg.providerCode || pkg.id || `tc-package-${index}`,
```
And replace it with:
```javascript
      id: pkg.packageId || pkg.referenceId || pkg.id || `tc-package-${index}`,
```

## Rollback Instructions for backend/travel-compositor-fast.js (normalizePackage ID extraction - original)

To revert the changes made to the `normalizePackage` function in `backend/travel-compositor-fast.js`:

Locate the following code block:
```javascript
      id: pkg.id || `tc-package-${index}`,
```
And replace it with:
```javascript
      id: pkg.packageId || pkg.referenceId || pkg.id || `tc-package-${index}`,
```

## Rollback Instructions for backend/server.js (Pre-TC Details Call Logging)

To revert the logging changes made to `backend/server.js` before the `travelCompositor.getPackageDetails` call:

Locate:
```javascript
        console.log(`[SERVER] Intentando obtener detalles de TC para ID: ${id}`);
```
And delete it.

## Rollback Instructions for backend/travel-compositor-fast.js (normalizePackage - Full Mapping)

To revert the changes made to the `normalizePackage` function in `backend/travel-compositor-fast.js`:

1.  **Remove `stripHtml` helper function:**

    Locate:
    ```javascript
  // Helper para limpiar HTML de strings
  stripHtml(htmlString) {
    if (!htmlString) return '';
    return htmlString.replace(/<[^>]*>?/gm, '');
  },
    ```
    And delete it.

2.  **Revert `normalizePackage` function to its previous state:**

    Locate the entire `normalizePackage` function and replace it with its content before the full mapping changes. (Refer to your git history or a backup if available).

## Rollback Instructions for frontend/src/app/paquetes/page.tsx (Ver Detalles Button Logging)

To revert the logging changes made to the "Ver Detalles" button in `frontend/src/app/paquetes/page.tsx`:

Locate the `onClick` handler for the "Ver Detalles" button and replace it with:
```javascript
                        onClick={() => openPackageModal(pkg.id)}
```

## Rollback Instructions for frontend/src/components/PackageDetailsModal.jsx (packageId Logging)

To revert the logging changes made to `frontend/src/components/PackageDetailsModal.jsx`:

Locate:
```javascript
  console.log('Modal: packageId recibido:', packageId);
```
And delete it.

## Rollback Instructions for backend/server.js (API Package Details Logging - New)

To revert the new logging changes made to the `/api/packages/:id` route in `backend/server.js`:

Locate:
```javascript
    console.log(`[BACKEND] Recibida solicitud para /api/packages/${id}. ID recibido: ${id}`);
```
And replace it with:
```javascript
    console.log(`📦 Solicitando detalles del paquete: ${id}`);
```

## Rollback Instructions for frontend/src/app/paquetes/page.tsx (encodeURIComponent for pkg.id)

To revert the `encodeURIComponent` change in `frontend/src/app/paquetes/page.tsx`:

Locate:
```javascript
                          openPackageModal(encodeURIComponent(pkg.id));
```
And replace it with:
```javascript
                          openPackageModal(pkg.id);
```

## Rollback Instructions for backend/server.js (decodeURIComponent for package ID)

To revert the `decodeURIComponent` change in `backend/server.js`:

Locate:
```javascript
    const { id: encodedId } = req.params;
    const id = decodeURIComponent(encodedId);
```
And replace it with:
```javascript
    const { id } = req.params;
```

## Rollback Instructions for backend/travel-compositor-fast.js (normalizePackage ID extraction - externalReference)

To revert the changes made to the `normalizePackage` function in `backend/travel-compositor-fast.js`:

Locate the following code block:
```javascript
      id: pkg.externalReference || pkg.id || `tc-package-${index}`,
```
And replace it with:
```javascript
      id: pkg.id || `tc-package-${index}`,
```

## Rollback Instructions for frontend/src/components/ParticleHero.tsx (dpr in Canvas)

To revert the `dpr` change in `frontend/src/components/ParticleHero.tsx`:

Locate:
```javascript
      <Canvas camera={{ position: [0, 0, 5] }} dpr={[1, 2]}>
```
And replace it with:
```javascript
      <Canvas camera={{ position: [0, 0, 5] }}>
```

## Rollback Instructions for frontend/src/components/ParticleHero.tsx (PointMaterial simplification)

To revert the simplification of `PointMaterial` in `frontend/src/components/ParticleHero.tsx`:

Locate:
```javascript
      <PointMaterial
        size={0.015}
      />
```
And replace it with:
```javascript
      <PointMaterial
        transparent
        color="#b38144" // Gold particles
        size={0.015}
        sizeAttenuation={true}
        depthWrite={false}
      />
```

## Rollback Instructions for frontend/src/components/ParticleHero.tsx (pointsMaterial usage)

To revert the usage of `pointsMaterial` in `frontend/src/components/ParticleHero.tsx`:

Locate:
```javascript
import { Points } from '@react-three/drei';
import * as THREE from 'three';

const ParticleSystem = () => {
  const ref = useRef<THREE.Points>(null!);

  const count = 1000; // Reduced number of particles
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta / 100; // Slower rotation
      ref.current.rotation.y += delta / 150; // Slower rotation
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <pointsMaterial color="#b38144" size={0.015} />
    </Points>
  );
};
```
And replace it with:
```javascript
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const ParticleSystem = () => {
  const ref = useRef<THREE.Points>(null!);

  const count = 1000; // Reduced number of particles
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta / 100; // Slower rotation
      ref.current.rotation.y += delta / 150; // Slower rotation
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#b38144" // Gold particles
        size={0.015}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
};
```