
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
    const { dueAmount = 0, damagedValue = 0, shortageValue = 0 } = shipment;
    let roadExpenses = shipment.roadExpenses;
    if (roadExpenses === null || roadExpenses === undefined) {
        console.warn(`Road expenses is null/undefined for shipment ${shipment.id}, defaulting to 0`);
        roadExpenses = 0;
    }
    const dueAmountAfterDiscount = dueAmount - damagedValue - shortageValue - roadExpenses;
    return { dueAmountAfterDiscount };
};

/**
 * Calculates the final financial values managed by the admin.
 * Formula: إجمالي المبلغ المستحق النهائي = المبلغ المستحق + سندات تحسين + ممسى - التالف - النقص - مبالغ أخرى
 * @param shipment - The shipment object with all financial fields.
 * @returns A partial Shipment object containing the `totalDueAmount`.
 */
export const calculateAdminValues = (shipment: Shipment): Partial<Shipment> => {
    const {
        dueAmount = 0,
        damagedValue = 0,
        shortageValue = 0,
        otherAmounts = 0,
        improvementBonds = 0,
        eveningAllowance = 0
    } = shipment;

    // Formula: المبلغ المستحق + سندات تحسين + ممسى - التالف - النقص - مبالغ أخرى
    const totalDueAmount = dueAmount + improvementBonds + eveningAllowance - damagedValue - shortageValue - otherAmounts;

    return { totalDueAmount };
};

/**
 * Calculates the final amount for a shipment, ensuring it's calculated correctly.
 * This is the authoritative function for all final amount calculations across the app.
 * @param shipment - The shipment object with all financial fields
 * @returns The final amount (can be negative)
 */
export const calculateFinalAmount = (shipment: Shipment): number => {
    // First try to use the stored totalDueAmount if available and valid
    if (shipment.totalDueAmount !== undefined && shipment.totalDueAmount !== null && !isNaN(shipment.totalDueAmount)) {
        return shipment.totalDueAmount;
    }

    // Fallback to calculating from scratch using admin values
    const adminValues = calculateAdminValues(shipment);
    return adminValues.totalDueAmount || 0;
};
