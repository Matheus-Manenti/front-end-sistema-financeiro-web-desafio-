import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Interceptor para garantir que o token seja enviado em toda requisição
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token enviado no cabeçalho Authorization:', config.headers.Authorization); // Log detalhado
    } else {
      console.warn('Token não encontrado no localStorage');
    }
  } else {
    console.warn('Ambiente não suporta localStorage');
  }
  return config;
});

export const login = async (email: string, pas_word: string) => {
  const response = await api.post('/auth/login', { email, pas_word });
  const authToken = response.data.token;
  if (authToken && typeof window !== 'undefined') {
    localStorage.setItem('token', authToken);
  }
  return response.data;
};

export const getAllClients = async () => {
  const response = await api.get('/clients/list-all');
  return response.data;
};

export type ClienteInput = {
  name: string;
  email: string;
  phone: string;
  isActive?: boolean;
};

export const createClient = async (clientData: ClienteInput) => {
  const response = await api.post('/clients/create', {
    ...clientData,
    isActive: clientData.isActive ?? true, // Garante que o cliente seja criado como ADIMPLENTE por padrão
  });
  return response.data;
};

export const updateClient = async (id: string, clientData: ClienteInput) => {
  const response = await api.patch(`/clients/update/${id}`, clientData);
  return response.data;
};

export const updateClientStatus = async (id: string) => {
  const response = await api.patch(`/clients/update-status/${id}`);
  return response.data;
};

export const toggleOrderPayment = async (orderId: string) => {
  try {
    const response = await api.patch(`/orders/${orderId}/toggle-payment`);
    console.log('toggleOrderPayment response:', response.data); 
    return response.data;
  } catch (error) {
    console.error('Erro ao alternar pagamento:', error);
    throw error;
  }
};

export const toggleClientFinancialStatus = async (id: string) => {
  const response = await toggleFinancialStatusInDialog(id);
  return response;
};

export const updateOrderStatus = async (orderId: string) => {
  const response = await api.patch(`/clients/toggle-financial-status/${orderId}`);
  return response.data;
};

export const toggleFinancialStatusInDialog = async (id: string) => {
  const response = await api.patch(`/clients/toggle-financial-status/${id}`);
  return response.data;
};

export default api;
