import { uid } from './uid'

// Factory-Helfer für die Rezept-Datenstruktur. An einer Stelle gebündelt,
// damit sich Storage-Backends und das Formular über den Aufbau einig sind.

export function newIngredient(amount = '', name = '') {
  return { id: uid(), amount, name, optional: false }
}

export function newStep(text = '') {
  return { id: uid(), text }
}

export function newRecipe() {
  return {
    id: uid(),
    title: '',
    category: 'deftig',
    image: null,
    // Menge bei ×1 Portion — beide optional, beide skalieren mit den Portionen.
    serves: 4, // "für N Personen"
    makes: null, // "ergibt N Stück"
    versucherle: false, // "A Versucherle" — noch nicht erprobt / zum Ausprobieren
    comment: '', // wird über der Zutatenliste gezeigt, nur wenn nicht leer
    ingredients: [newIngredient()],
    steps: [newStep()],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// Alle Zutatennamen eines Rezepts (klein geschrieben) fürs Filtern/Suchen.
export function recipeIngredientNames(recipe) {
  return (recipe.ingredients || [])
    .map((ing) => (ing.name || '').trim().toLowerCase())
    .filter(Boolean)
}
