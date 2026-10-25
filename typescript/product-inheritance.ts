import { Shoe, Perfume } from '../src/lib/productModels.ts';

const shoe = new Shoe('Everyday Sneaker', 'Lookalike Demo', 2499, 8);
const perfume = new Perfume('Citrus Eau de Parfum', 'Lookalike Demo', 1799, 50);
console.log(shoe.describe());
console.log(perfume.describe());
