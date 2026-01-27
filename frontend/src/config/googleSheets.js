// src/config/googleSheets.js
const API_URL = 'https://script.google.com/macros/s/AKfycbyXJXLSMfNmYuEQwjjiiomaEHV_KklGa5IIHBUtpAD4cGraz65yHrT-1QEglXgyOvIX/exec';

const apiRequest = async (action, params = {}) => {
  const queryParams = new URLSearchParams();
  queryParams.append('action', action);
  
  // Enviar parámetros planos
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      if (typeof params[key] === 'object') {
        queryParams.append(key, JSON.stringify(params[key]));
      } else {
        queryParams.append(key, params[key].toString());
      }
    }
  });
  
  const url = `${API_URL}?${queryParams.toString()}`;
  console.log('🌐 Request:', action);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    
    if (!text) {
      throw new Error('Respuesta vacía de la API');
    }
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Error parsing JSON:', text.substring(0, 200));
      throw new Error('Respuesta inválida de la API');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Error desconocido en la API');
    }
    
    console.log('✅ Success:', action);
    return data;
  } catch (error) {
    console.error('❌ Error en', action, ':', error.message);
    throw error;
  }
};

export const checkApiHealth = async () => {
  try {
    const response = await apiRequest('health');
    return response.success && response.status === 'ok';
  } catch (error) {
    console.error('Error checking API health:', error);
    return false;
  }
};

export default apiRequest;