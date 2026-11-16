// Format as you type, so nobody has to type spaces or "/". Checkout validation still runs on Pay.
const digits = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max)
/** "4242424242424242" → "4242 4242 4242 4242" */
export const formatCardNumber = (value: string) => digits(value, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
/** "1228" → "12/28". The "/" appears only from the 3rd digit, so Backspace can still delete the month. */
export const formatExpiry = (value: string) => {
  const d = digits(value, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}
export const formatCvc = (value: string) => digits(value, 3)
