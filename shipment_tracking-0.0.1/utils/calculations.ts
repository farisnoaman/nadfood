
import { Shipment, Region, ProductPrice, DeductionPrice, ShipmentProduct } from '../types';

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
        // Find all prices for this product and region that are effective on or before the order date
        const relevantPrices = productPrices.filter(pp =>
            pp.regionId === shipment.regionId &&
            pp.productId === p.productId &&
            pp.effectiveFrom <= shipment.orderDate
        );

        // Sort by effectiveFrom date descending to get the most recent valid price
        const latestPrice = relevantPrices.sort((a, b) =>
            new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
        )[0];

        const productWage = latestPrice ? latestPrice.price : 0;
        if (!latestPrice || latestPrice.price <= 0) {
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
        otherAmounts = 0,
        improvementBonds = 0,
        eveningAllowance = 0,
        transferFee = 0
    } = shipment;

    // Calculate total shortage and damaged values from itemized product data
    const totalShortageValue = shipment.products.reduce((acc, p) => acc + (p.shortageValue || 0), 0);
    const totalDamagedValue = shipment.products.reduce((acc, p) => acc + (p.damagedValue || 0), 0);

    // Formula: المبلغ المستحق + سندات تحسين + ممسى + رسوم التحويل - التالف - النقص - مبالغ أخرى
    const totalDueAmount = dueAmount + improvementBonds + eveningAllowance + transferFee - totalDamagedValue - totalShortageValue - otherAmounts;

    return { totalDueAmount, damagedValue: totalDamagedValue, shortageValue: totalShortageValue };
};

/**
 * Calculates a single product's deduction values based on cartons, rates, and punishment prices.
 * Formula: value = (cartons * punishment_price) * (1 - exemption_rate / 100)
 * @param product - The product with cartons and exemption rates filled in.
 * @param deductionPrices - All available deduction prices.
 * @param orderDate - The shipment's order date for versioned lookup.
 * @returns The product with calculated shortageValue and damagedValue.
 */
export const calculateProductDeductions = (
    product: ShipmentProduct,
    deductionPrices: DeductionPrice[],
    orderDate: string
): ShipmentProduct => {
    const relevantPrices = deductionPrices.filter(dp =>
        dp.productId === product.productId &&
        dp.effectiveFrom <= orderDate
    );

    const latestPrice = relevantPrices.sort((a, b) =>
        new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
    )[0];

    const shortagePrice = latestPrice?.shortagePrice || 0;
    const damagedPrice = latestPrice?.damagedPrice || 0;

    const shortageCartons = product.shortageCartons || 0;
    const shortageExemptionRate = product.shortageExemptionRate || 0;
    const damagedCartons = product.damagedCartons || 0;
    const damagedExemptionRate = product.damagedExemptionRate || 0;

    const shortageValue = (shortageCartons * shortagePrice) * (1 - shortageExemptionRate / 100);
    const damagedValue = (damagedCartons * damagedPrice) * (1 - damagedExemptionRate / 100);

    return {
        ...product,
        shortageValue: Math.round(shortageValue),
        damagedValue: Math.round(damagedValue),
    };
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
