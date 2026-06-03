const API_BASE = 'https://us-central1-ogasapp-5a003.cloudfunctions.net';

async function apiCall(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Sellers
export const getVendors = () => apiCall('/getVendors');
export const registerSeller = (data: any) => 
  apiCall('/registerSeller', { method: 'POST', body: JSON.stringify(data) });

// Orders
export const createOrder = (data: any) => 
  apiCall('/createOrder', { method: 'POST', body: JSON.stringify(data) });
export const getOrders = (params?: { buyerId?: string; sellerId?: string; status?: string }) => {
  const query = new URLSearchParams(params as any).toString();
  return apiCall(`/getOrders?${query}`);
};
export const updateOrderStatus = (orderId: string, status: string) => 
  apiCall('/updateOrderStatus', { method: 'POST', body: JSON.stringify({ orderId, status }) });

// Messages
export const getMessages = (chatId: string) => 
  apiCall(`/getMessages?chatId=${chatId}`);
export const sendMessage = (data: any) => 
  apiCall('/sendMessage', { method: 'POST', body: JSON.stringify(data) });
