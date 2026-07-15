# @lemn-ltd/brand-studio

Controlled, persistence-free authoring UI for the versioned LEMN project-brand contract.

The Studio compiles and previews drafts locally. Authentication, storage, publication, assignments and audit remain host responsibilities exposed through typed intent callbacks.

```tsx
import { BrandStudio, createBrandFromPreset } from "@lemn-ltd/brand-studio";
import "@lemn-ltd/brand-studio/styles.css";

const [brand, setBrand] = useState(() => createBrandFromPreset("aster-vault"));
return <BrandStudio value={brand} onChange={setBrand} onIntent={handleIntent} />;
```
