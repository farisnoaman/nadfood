import React from 'react';
import { ShipmentProduct } from '../../../types';
import { Icons } from '../../Icons';

interface ProductDetailsProps {
  products: ShipmentProduct[];
  isExpanded: boolean;
  onToggle: () => void;
  title?: string;
}

/**
 * A reusable, collapsible section to display the list of products in a shipment.
 */
const ProductDetails: React.FC<ProductDetailsProps> = ({ products, isExpanded, onToggle, title = "تفاصيل المنتجات" }) => (
  <div className="bg-secondary-50 dark:bg-secondary-900 rounded-md">
    <button
      type="button"
      className="w-full flex justify-between items-center p-3 text-right font-bold"
      onClick={onToggle}
      aria-expanded={isExpanded}
    >
      <span>{title}</span>
      <Icons.ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
    </button>
    {isExpanded && (
      <div className="p-3 border-t border-secondary-200 dark:border-secondary-700 space-y-2">
        {products.map(p => {
          const pricePerCarton = p.cartonCount > 0 && p.productWagePrice ? (p.productWagePrice / p.cartonCount).toFixed(2) : 'غير متاح';
          return (
            <div key={p.productId} className="py-2 border-b border-secondary-200 dark:border-secondary-700 last:border-b-0">
              <p className="font-semibold">{p.productName}</p>
              <div className="flex justify-between items-center text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                <span>الكمية: {p.cartonCount} كرتون</span>
                <span>{`السعر: ${pricePerCarton} ر.ي / للكرتون`}</span>
                <span className="font-medium text-secondary-800 dark:text-secondary-200">الإجمالي: {(p.productWagePrice || 0).toLocaleString('en-US')} ر.ي</span>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default ProductDetails;
