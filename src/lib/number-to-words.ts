const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertLessThanOneThousand(n: number): string {
  if (n === 0) return '';
  let result = '';
  if (n >= 100) {
    result += ones[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    result += tens[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    result += ones[n] + ' ';
  }
  return result.trim();
}

export function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = '';
  let n = rupees;

  if (n >= 10000000) {
    result += convertLessThanOneThousand(Math.floor(n / 10000000)) + ' Crore ';
    n %= 10000000;
  }
  if (n >= 100000) {
    result += convertLessThanOneThousand(Math.floor(n / 100000)) + ' Lakh ';
    n %= 100000;
  }
  if (n >= 1000) {
    result += convertLessThanOneThousand(Math.floor(n / 1000)) + ' Thousand ';
    n %= 1000;
  }
  if (n > 0) {
    result += convertLessThanOneThousand(n);
  }

  let finalString = result.trim() + ' Rupees';

  if (paise > 0) {
    finalString += ' and ' + convertLessThanOneThousand(paise) + ' Paise';
  }

  return finalString + ' Only';
}
