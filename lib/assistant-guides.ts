export type AssistantAction = {
  label: string;
  href: string;
};

export type AssistantGuide = {
  answer: string;
  actions: AssistantAction[];
};

const actions = {
  register: { label: 'Start seller registration', href: '/seller/register' },
  sellerLogin: { label: 'Seller sign in', href: '/seller/login' },
  dashboard: { label: 'Open seller dashboard', href: '/seller/dashboard' },
  earnings: { label: 'View seller earnings', href: '/seller/earnings' },
  shops: { label: 'Find a verified seller', href: '/shops' },
  orders: { label: 'Open my orders', href: '/orders' },
  chat: { label: 'Open OGas chat', href: '/chat' },
} satisfies Record<string, AssistantAction>;

export function getAssistantGuide(message: string): AssistantGuide | null {
  const query = message.toLowerCase().replace(/[’‘]/g, "'");
  const registrationProblem = /(register|registration|sign up|seller form|seller account)/.test(query)
    && /(not working|failed|failing|error|stuck|can't|cant|cannot|unable|problem|issue)/.test(query);

  if (registrationProblem) {
    return {
      answer: 'Let’s check the real registration requirements:\n1. Sign in to your OGas account.\n2. Complete your business name and phone number.\n3. Capture and confirm your shop location, or use the manual map pin.\n4. Add both a front-of-shop photo and a stock photo.\n5. Retry the submission and keep the page open during uploads. Your draft and uploaded photos are saved on this phone.\n\nIf it still fails, tell OGas support the exact error shown. Never send your password, PIN or OTP.',
      actions: [actions.register, actions.sellerLogin],
    };
  }

  const sellerRegistration = /(start selling|sell on ogas|become (an )?(ogas )?seller|seller registration|register (as )?(an |a )?(ogas )?seller|register my (shop|store|business)|create (a )?seller account|sign up (as )?(a )?seller|join ogas as a seller|how (do|can) i sell gas)/.test(query);
  if (sellerRegistration) {
    return {
      answer: 'Great—you can register yourself on OGas.\n1. Sign in through the seller desk.\n2. Open seller registration and enter your business name, seller type, phone, landmark and address.\n3. Capture and confirm your shop location. If GPS fails, use the manual map pin.\n4. Add front-of-shop and stock photos, then enter stock, prices, hours and delivery availability.\n5. Submit for review. Approval is not automatic; OGas reviews the shop before it can go live.\n\nYour draft is saved on this phone. After review, use the dashboard and link your payout account when prompted.',
      actions: [actions.register, actions.sellerLogin],
    };
  }

  if (/(track|where is|check|see).*(my )?order|order.*(status|successful|success)/.test(query)) {
    return {
      answer: 'Open Orders to see orders placed with your signed-in account and their current status. If an order is missing, confirm that you are using the same account you ordered with. For a payment or status problem, contact OGas support with the order reference—never share your password, PIN, OTP or Door Code before receiving and checking your gas.',
      actions: [actions.orders],
    };
  }

  if (/(change|edit|update|correct).*(delivery|address|phone|location)|delivery.*(wrong|change|edit)/.test(query)) {
    return {
      answer: 'Open Orders and select the order to review its delivery details. If the order cannot be edited, use OGas chat or contact support promptly so the seller does not leave with the wrong details. Only share your Door Code after the correct delivery arrives and you have checked the gas.',
      actions: [actions.orders, actions.chat],
    };
  }

  if (/(open|close|availability|available).*(my )?(store|shop)|store.*(open|closed)/.test(query)) {
    return {
      answer: 'Sign in to your seller dashboard. At the top of your store page, use the STORE OPEN / STORE CLOSED switch. When the store is open, customers can see and order from you; when it is closed, you are hidden from the marketplace.',
      actions: [actions.dashboard],
    };
  }

  if (/(my|seller|store|shop).*(earnings|balance|payout)|(?:earnings|payout).*(my|seller|store|shop)/.test(query)) {
    return {
      answer: 'Open Seller Earnings to review your own earnings and payout information. If OGas asks you to link a payout account, complete that step from the seller area. The assistant cannot view or change your private financial details.',
      actions: [actions.earnings, actions.dashboard],
    };
  }

  if (/(change|update|set|edit).*(my )?(price|stock|inventory)|(?:price|stock|inventory).*(my )?(store|shop|seller)/.test(query)) {
    return {
      answer: 'Sign in to your seller dashboard and find MY INVENTORY. Enter your price per kg, adjust Gas in stock using the minus or plus controls, then tap SAVE CHANGES. The dashboard confirms when the changes are live. The assistant cannot change these values for you.',
      actions: [actions.dashboard],
    };
  }

  if (/(place|make|complete).*(my )?(first )?order|how (do|can) i (buy|order)|order.*successful|how.*buying gas/.test(query)) {
    return {
      answer: 'To buy gas on OGas:\n1. Open Shops and choose a verified seller.\n2. Enter your budget or select a cylinder size.\n3. Choose pickup or delivery and provide the requested contact details.\n4. Choose cash or online payment, then place the order.\n5. Open Orders to follow its status.\n\nFor eligible online payments, escrow protects the payment until confirmation. Share your Door Code only after you receive and check the gas.',
      actions: [actions.shops, actions.orders],
    };
  }

  return null;
}
