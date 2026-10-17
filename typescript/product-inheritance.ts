class Product {
  constructor(public name: string, public brand: string, public price: number) {}
  describe(): string {
    return `${this.brand} ${this.name} — ₹${this.price.toLocaleString("en-IN")}`;
  }
}
class Shoe extends Product {
  constructor(name: string, brand: string, price: number, public sizeUK: number) {
    super(name, brand, price);
  }
  override describe(): string { return `${super.describe()} | UK size ${this.sizeUK}`; }
}
class Perfume extends Product {
  constructor(name: string, brand: string, price: number, public volumeML: number) {
    super(name, brand, price);
  }
  override describe(): string { return `${super.describe()} | ${this.volumeML} ml`; }
}
const shoe = new Shoe("Everyday Sneaker", "Lookalike Demo", 2499, 8);
const perfume = new Perfume("Citrus Eau de Parfum", "Lookalike Demo", 1799, 50);
console.log(shoe.describe());
console.log(perfume.describe());
