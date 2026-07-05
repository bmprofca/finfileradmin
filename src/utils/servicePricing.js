const roundMoney = (value) => parseFloat(Number(value || 0).toFixed(2));

export const calculateServicePricing = ({
  base_price: basePrice = 0,
  tax_rate: taxRate = 0,
  discount_type: discountType = 'not applicable',
  discount_percentage: discountPercentage = 0,
  discount_value: discountValueInput = 0,
}) => {
  const base = roundMoney(basePrice);
  const rate = Number(taxRate) || 0;

  let discountValue = 0;
  if (discountType === 'percentage') {
    discountValue = roundMoney(base * (Number(discountPercentage) || 0) / 100);
  } else if (discountType === 'flat') {
    discountValue = roundMoney(Math.min(base, Number(discountValueInput) || 0));
  }

  const discountedBase = roundMoney(Math.max(0, base - discountValue));
  const taxValue = roundMoney(discountedBase * rate / 100);
  const fees = roundMoney(discountedBase + taxValue);
  const taxOnFullBase = roundMoney(base * rate / 100);
  const originalFees = roundMoney(base + taxOnFullBase);

  return {
    tax_value: taxValue,
    total_fees: discountedBase,
    discount_value: discountValue,
    fees,
    original_fees: originalFees,
  };
};

export default calculateServicePricing;
