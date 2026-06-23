/**
 * Calculates the booking price based on start time, duration (in hours), and base rate.
 * Day slots (before 5:00 PM / 17:00) use the basePrice.
 * Evening slots (5:00 PM / 17:00 onwards) add a ₹100/hour lights charge.
 * 
 * @param {string} startTime - Format 'HH:mm', e.g. '14:30'
 * @param {number} duration - Number of hours (typically integer)
 * @param {number} basePrice - Base rate per hour
 * @returns {{ totalAmount: number, lightsCharge: number, baseAmount: number }}
 */
export const calculateBookingPrice = (startTime, duration, basePrice) => {
  const [startHour] = startTime.split(':').map(Number);
  let totalAmount = 0;
  let lightsCharge = 0;
  let baseAmount = 0;

  for (let i = 0; i < duration; i++) {
    const currentHour = (startHour + i) % 24;
    if (currentHour < 17) {
      totalAmount += basePrice;
      baseAmount += basePrice;
    } else {
      totalAmount += basePrice + 100;
      baseAmount += basePrice;
      lightsCharge += 100;
    }
  }

  return {
    totalAmount,
    lightsCharge,
    baseAmount
  };
};
