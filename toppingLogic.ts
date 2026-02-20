/**
 * Topping customization logic and pricing rules
 */

export interface Topping {
  id: number;
  name: string;
  category: 'vegetable' | 'meat' | 'cheese';
  smallPrice: string;
  mediumPrice: string;
  largePrice: string;
}

export interface ToppingModification {
  type: 'add' | 'remove' | 'replace';
  topping: Topping;
  replacedTopping?: Topping;
  halfPizza?: 'whole' | 'left' | 'right';
}

export interface CustomizationResult {
  isValid: boolean;
  additionalCharge: number;
  errorMessage?: string;
}

/**
 * Get topping price based on pizza size
 */
export function getToppingPrice(topping: Topping, size: string): number {
  const sizeKey = size.toLowerCase();
  if (sizeKey.includes('10') || sizeKey.includes('small') || sizeKey.includes('9')) {
    return parseFloat(topping.smallPrice);
  } else if (sizeKey.includes('12') || sizeKey.includes('medium') || sizeKey.includes('11')) {
    return parseFloat(topping.mediumPrice);
  } else if (sizeKey.includes('14') || sizeKey.includes('large')) {
    return parseFloat(topping.largePrice);
  }
  return parseFloat(topping.mediumPrice); // default
}

/**
 * Validate topping replacement according to rules:
 * - Only vegetables can replace vegetables
 * - Only meats/cheese can replace meats/cheese
 * - Replacing vegetable with meat/cheese requires additional charge
 */
export function validateToppingReplacement(
  originalTopping: Topping,
  newTopping: Topping,
  size: string,
  existingReplacements: number = 0
): CustomizationResult {
  // Rule: Only 1 free replacement per pizza
  if (existingReplacements >= 1) {
    return {
      isValid: true,
      additionalCharge: getToppingPrice(newTopping, size),
      errorMessage: undefined,
    };
  }

  // Rule: Vegetables can only replace vegetables (free)
  if (originalTopping.category === 'vegetable' && newTopping.category === 'vegetable') {
    return {
      isValid: true,
      additionalCharge: 0,
    };
  }

  // Rule: Meats/cheese can replace meats/cheese (free)
  if (
    (originalTopping.category === 'meat' || originalTopping.category === 'cheese') &&
    (newTopping.category === 'meat' || newTopping.category === 'cheese')
  ) {
    return {
      isValid: true,
      additionalCharge: 0,
    };
  }

  // Rule: Replacing vegetable with meat/cheese requires charge
  if (
    originalTopping.category === 'vegetable' &&
    (newTopping.category === 'meat' || newTopping.category === 'cheese')
  ) {
    return {
      isValid: true,
      additionalCharge: getToppingPrice(newTopping, size),
    };
  }

  // Rule: Cannot replace meat/cheese with vegetable
  if (
    (originalTopping.category === 'meat' || originalTopping.category === 'cheese') &&
    newTopping.category === 'vegetable'
  ) {
    return {
      isValid: false,
      additionalCharge: 0,
      errorMessage: 'Cannot replace meat or cheese with vegetables. You can remove the topping and add a vegetable separately.',
    };
  }

  return {
    isValid: false,
    additionalCharge: 0,
    errorMessage: 'Invalid topping replacement',
  };
}

/**
 * Calculate additional charge for adding a topping
 */
export function calculateAddToppingCharge(topping: Topping, size: string): number {
  return getToppingPrice(topping, size);
}

/**
 * Validate if pizza size supports half-and-half
 */
export function canSplitPizza(size: string, isGlutenFree: boolean): boolean {
  if (isGlutenFree) {
    return false; // No half-and-half for gluten-free pizzas
  }
  
  const sizeKey = size.toLowerCase();
  // Only 12" (medium) and 14" (large) can be split
  return sizeKey.includes('12') || sizeKey.includes('medium') || 
         sizeKey.includes('14') || sizeKey.includes('large');
}

/**
 * Calculate total customization charges
 */
export function calculateCustomizationTotal(
  modifications: ToppingModification[],
  size: string,
  existingReplacements: number = 0
): number {
  let total = 0;
  let replacementCount = existingReplacements;

  for (const mod of modifications) {
    if (mod.type === 'add') {
      total += calculateAddToppingCharge(mod.topping, size);
    } else if (mod.type === 'replace' && mod.replacedTopping) {
      const result = validateToppingReplacement(
        mod.replacedTopping,
        mod.topping,
        size,
        replacementCount
      );
      if (result.isValid) {
        total += result.additionalCharge;
        replacementCount++;
      }
    }
    // 'remove' type has no charge
  }

  return total;
}
