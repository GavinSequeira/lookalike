// TypeScript classes + inheritance. Used by the /products-demo page and by
// `npm run demo:typescript` (typescript/product-inheritance.ts).
export class Product {
  constructor(public name: string, public brand: string, public price: number) {}

  describe(): string {
    return `${this.brand} ${this.name} — ₹${this.price.toLocaleString('en-IN')}`;
  }

  // Overridden by subclasses; the base class has no category-specific detail.
  get detail(): string { return ''; }
}

export class Shoe extends Product {
  constructor(name: string, brand: string, price: number, public sizeUK: number) {
    super(name, brand, price);
  }
  get detail(): string { return `UK size ${this.sizeUK}`; }
  override describe(): string { return `${super.describe()} | ${this.detail}`; }
}

export class Perfume extends Product {
  constructor(name: string, brand: string, price: number, public volumeML: number) {
    super(name, brand, price);
  }
  get detail(): string { return `${this.volumeML} ml`; }
  override describe(): string { return `${super.describe()} | ${this.detail}`; }
}
