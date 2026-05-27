// src/services/deudoresService.js
import api from './apiClient';

const deudoresService = {

  async obtenerDeudores() {
    try {
      console.log('📋 Obteniendo deudores...');
      const response = await api.get('/api/deudores');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener deudores:', error);
      throw new Error('No se pudieron cargar los deudores.');
    }
  },

  async obtenerDeudorPorId(id) {
    try {
      const response = await api.get(`/api/deudores/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener deudor:', error);
      throw new Error('Deudor no encontrado');
    }
  },

  async crearDeudor(deudor) {
    try {
      if (!deudor.nombre || deudor.nombre.trim() === '') {
        throw new Error('El nombre del deudor es obligatorio');
      }

      console.log('👤 Creando deudor:', deudor.nombre);

      const response = await api.post('/api/deudores', {
        nombre: deudor.nombre.trim(),
        telefono: deudor.telefono?.trim() || ''
      });

      console.log('✅ Deudor creado');
      return response.data;
    } catch (error) {
      console.error('Error al crear deudor:', error);
      throw error;
    }
  },

  async buscarDeudor(termino) {
    try {
      if (!termino || termino.trim() === '') {
        return await this.obtenerDeudores();
      }

      const response = await api.get(`/api/deudores?search=${encodeURIComponent(termino.trim())}`);
      return response.data || [];
    } catch (error) {
      console.error('Error al buscar deudor:', error);
      throw error;
    }
  },

  async crearDeuda(deuda) {
    try {
      if (!deuda.clienteNombre && !deuda.deudorId) {
        throw new Error('Debe indicar un deudor');
      }
      if (!deuda.monto || deuda.monto <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      console.log('💳 Creando deuda:', deuda);

      const response = await api.post('/api/deudas', {
        clienteNombre: deuda.clienteNombre || '',
        clienteTelefono: deuda.clienteTelefono || '',
        deudorId: deuda.deudorId || '',
        ventaId: deuda.ventaId || '',
        monto: parseFloat(deuda.monto),
        descripcion: deuda.descripcion || '',
        referencia: deuda.referencia || ''
      });

      console.log('✅ Deuda creada');
      return response.data;
    } catch (error) {
      console.error('Error al crear deuda:', error);
      throw error;
    }
  },

  async obtenerDeudas(deudorId) {
    try {
      const response = await api.get(`/api/deudores/${deudorId}/deudas`);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener deudas:', error);
      throw error;
    }
  },

  // Alias para compatibilidad con código antiguo
  async obtenerDeudasPorDeudor(deudorId) {
    return this.obtenerDeudas(deudorId);
  },

  async registrarAbono(abono) {
    try {
      console.log('💰 Datos recibidos en registrarAbono:', abono);

      if (!abono.deudaId) {
        throw new Error('Debe seleccionar una deuda');
      }
      if (!abono.monto || abono.monto <= 0) {
        throw new Error('El monto del abono debe ser mayor a 0');
      }

      const response = await api.post('/api/abonos', {
        deudaId: abono.deudaId,
        deudorId: abono.deudorId || '',
        monto: parseFloat(abono.monto),
        metodoPago: abono.metodoPago || 'efectivo',
        observaciones: abono.observaciones || abono.notas || '',
        registradoPor: abono.registradoPor || 'system'
      });

      console.log('✅ Abono registrado');
      return response.data;
    } catch (error) {
      console.error('Error al registrar abono:', error);
      throw error;
    }
  },

  async obtenerDeudorConDetalles(deudorId) {
    try {
      const deudor = await this.obtenerDeudorPorId(deudorId);
      const deudas = await this.obtenerDeudas(deudorId);

      return {
        ...deudor,
        deudas,
        totalDeudas: deudas.length,
        deudasPendientes: deudas.filter(d => d.estado === 'pendiente').length,
        deudasPagadas: deudas.filter(d => d.estado === 'pagado').length
      };
    } catch (error) {
      console.error('Error al obtener deudor con detalles:', error);
      throw error;
    }
  },

  async validarMontoAbono(deudaId, deudorId, montoAbono) {
    const deudas = await this.obtenerDeudas(deudorId);
    const deuda = deudas.find(d => d.id === deudaId);

    if (!deuda) {
      throw new Error('Deuda no encontrada');
    }

    if (montoAbono > deuda.saldo) {
      throw new Error(
        `El abono no puede ser mayor al saldo pendiente ($${deuda.saldo.toLocaleString()})`
      );
    }

    return true;
  },

  async obtenerTotalDeuda() {
    try {
      const response = await api.get('/api/dashboard/stats');
      return response.data?.deudaTotal || 0;
    } catch (error) {
      console.error('Error al obtener total deuda:', error);
      throw error;
    }
  }
};

export default deudoresService;
