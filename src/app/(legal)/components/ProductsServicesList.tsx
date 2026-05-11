import { getProductsAndServices } from "@/lib/legal/mdx";

export function ProductsServicesList() {
  const { products, services } = getProductsAndServices();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section>
        <h3 className="text-lg font-semibold text-[color:var(--glass-text-title)]">Products</h3>
        <ul className="mt-3 space-y-3 text-sm text-[color:var(--glass-text-muted)]">
          {products.map((product) => (
            <li key={product.slug} className="glass-surface glass-subtle glass-e1 rounded-lg p-3">
              <p className="font-medium text-[color:var(--glass-text-title)]">{product.name}</p>
              <p className="mt-1 text-sm text-[color:var(--glass-text-muted)]">{product.description}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-lg font-semibold text-[color:var(--glass-text-title)]">Services</h3>
        <ul className="mt-3 space-y-3 text-sm text-[color:var(--glass-text-muted)]">
          {services.map((service) => (
            <li key={service.slug} className="glass-surface glass-subtle glass-e1 rounded-lg p-3">
              <p className="font-medium text-[color:var(--glass-text-title)]">{service.name}</p>
              <p className="mt-1 text-sm text-[color:var(--glass-text-muted)]">{service.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
