export const DEFAULT_DEV_INPUT = JSON.stringify(
  {
    order_id: 'ORD-2024-001',
    amount: 8500,
    currency: 'CNY',
    requester: {
      id: 'U-8821',
      name: 'Alex Chen',
      department: 'Engineering',
    },
    items: [
      { name: 'Server License', price: 4000 },
      { name: 'Cloud Credits', price: 4500 },
    ],
  },
  null,
  2
)
