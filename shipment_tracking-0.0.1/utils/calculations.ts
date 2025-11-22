
import { Shipment, Region, ProductPrice } from '../types';

/**
 * Calculates the initial financial values for a new shipment based on sales data.
 * This is typically run when a sales user creates a new shipment.
 * @param shipment - The base shipment data from the sales form.
 * @param regions - A list of all available regions to find fees and diesel costs.
 * @param productPrices - A list of all product prices to calculate total wages.
 * @returns A partial Shipment object with calculated values like totalWage, totalDiesel, dueAmount, etc.
 */
export const calculateInitialShipmentValues = (
    shipment: Omit<Shipment, 'entryTimestamp' | 'id' | 'status'>,
    regions: Region[],
    productPrices: ProductPrice[]
): Partial<Shipment> => {
    const region = regions.find(r => r.id === shipment.regionId);
    if (!region) return {};

    let hasMissingPrices = false;
    const calculatedProducts = shipment.products.map(p => {
        const priceInfo = productPrices.find(pp => pp.regionId === shipment.regionId && pp.productId === p.productId);
        const productWage = priceInfo ? priceInfo.price : 0;
        if (!priceInfo || priceInfo.price <= 0) {
            hasMissingPrices = true;
        }
        return {
            ...p,
            productWagePrice: productWage * p.cartonCount,
        };
    });
    
    const totalWage = calculatedProducts.reduce((acc, p) => acc + (p.productWagePrice || 0), 0);
    const totalDiesel = region.dieselLiters * region.dieselLiterPrice;
    const zaitriFee = region.zaitriFee;
    const adminExpenses = zaitriFee; // As per requirement: admin expenses are equal to zaitri fee
    const roadExpenses = region.roadExpenses || 0; // Fixed road expenses from region

    const dueAmount = totalWage - totalDiesel - zaitriFee - adminExpenses - roadExpenses;

    return {
        products: calculatedProducts,
        totalWage,
        totalDiesel,
        zaitriFee,
        adminExpenses,
        dueAmount,
        hasMissingPrices,
    };
};

/**
 * Calculates the financial values managed by the accountant.
 * This function takes the initial due amount and subtracts various deductions.
 * @param shipment - The shipment object, which should include `dueAmount` and accountant-specific fields.
 * @returns A partial Shipment object containing the `dueAmountAfterDiscount`.
 */
export const calculateAccountantValues = (shipment: Shipment): Partial<Shipment> => {
    const { dueAmount = 0, damagedValue = 0, shortageValue = 0, roadExpenses = 0 } = shipment;
    const dueAmountAfterDiscount = dueAmount - damagedValue - shortageValue - roadExpenses;
    return { dueAmountAfterDiscount };
};

/**
 * Calculates the final financial values managed by the admin.
 * This function takes the accountant's calculated amount, applies admin adjustments (additions/deductions), and calculates tax.
 * @param shipment - The shipment object, which should include `dueAmountAfterDiscount` and admin-specific fields.
 * @returns A partial Shipment object containing the `totalDueAmount` and `totalTax`.
 */
export const calculateAdminValues = (shipment: Shipment): Partial<Shipment> => {
    const { 
        dueAmountAfterDiscount = 0, 
        otherAmounts = 0, 
        improvementBonds = 0, 
        eveningAllowance = 0,
        taxRate = 0
    } = shipment;
    
    // "otherAmounts" is a deduction as per UI labels ("خصميات إضافية")
    // "improvementBonds" and "eveningAllowance" are additions ("إضافات")
    const totalDueAmountBeforeTax = (dueAmountAfterDiscount || 0) + (improvementBonds || 0) + (eveningAllowance || 0) - (otherAmounts || 0);
    const totalTax = taxRate > 0 ? totalDueAmountBeforeTax * (taxRate / 100) : 0;
    const totalDueAmount = totalDueAmountBeforeTax + totalTax;

    return { totalDueAmount, totalTax };
};
