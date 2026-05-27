// src/services/productosService.js
import api from './apiClient';

const productosService = {

  // ==================== CATEGORÍAS ====================

  async obtenerCategorias() {
    try {
      console.log('📋 Obteniendo categorías...');
      const response = await api.get('/api/categorias');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw new Error('No se pudieron cargar las categorías.');
    }
  },

  async crearCategoria(categoria) {
    try {
      if (!categoria.nombre || categoria.nombre.trim() === '') {
        throw new Error('El nombre de la categoría es obligatorio');
      }

      console.log('📁 Creando categoría:', categoria.nombre);

      const response = await api.post('/api/categorias', {
        nombre: categoria.nombre.trim(),
        descripcion: categoria.descripcion?.trim() || ''
      });

      console.log('✅ Categoría creada');
      return response.data;
    } catch (error) {
      console.error('Error al crear categoría:', error);
      throw error;
    }
  },

  async actualizarCategoria(id, datos) {
    try {
      if (!id) throw new Error('ID de categoría no válido');

      const response = await api.put(`/api/categorias/${id}`, {
        nombre: datos.nombre?.trim(),
        descripcion: datos.descripcion?.trim()
      });

      return response.data;
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      throw error;
    }
  },

  async eliminarCategoria(id) {
    try {
      if (!id) throw new Error('ID de categoría no válido');

      await api.delete(`/api/categorias/${id}`);
      return true;
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      throw error;
    }
  },

  // ==================== PRODUCTOS ====================

  async obtenerProductos() {
    try {
      console.log('📦 Obteniendo productos...');
      const response = await api.get('/api/productos');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw new Error('No se pudieron cargar los productos.');
    }
  },

  async obtenerProductoPorId(id) {
    try {
      const response = await api.get(`/api/productos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener producto:', error);
      throw new Error('Producto no encontrado');
    }
  },

  async crearProducto(producto) {
    try {
      if (!producto.nombre || producto.nombre.trim() === '') {
        throw new Error('El nombre del producto es obligatorio');
      }
      if (!producto.precio && !producto.precioBase) {
        throw new Error('El precio debe ser mayor a 0');
      }

      const precio = parseFloat(producto.precio || producto.precioBase);
      if (precio <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      console.log('🛍️ Creando producto:', producto.nombre);

      const response = await api.post('/api/productos', {
        nombre: producto.nombre.trim(),
        descripcion: producto.descripcion?.trim() || '',
        precio,
        precioBase: precio,
        categoria: producto.categoria || 'General',
        categoriaId: producto.categoriaId || '',
        sku: producto.sku || '',
        variaciones: producto.variaciones || [],
        activo: true
      });

      console.log('✅ Producto creado');
      return response.data;
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  },

  async actualizarProducto(id, datos) {
    try {
      if (!id) throw new Error('ID de producto no válido');

      const body = { id };
      if (datos.nombre) body.nombre = datos.nombre.trim();
      if (datos.descripcion !== undefined) body.descripcion = datos.descripcion?.trim();
      if (datos.precio !== undefined) body.precio = parseFloat(datos.precio);
      if (datos.precioBase !== undefined) body.precioBase = parseFloat(datos.precioBase);
      if (datos.categoria !== undefined) body.categoria = datos.categoria;
      if (datos.categoriaId !== undefined) body.categoriaId = datos.categoriaId;
      if (datos.sku !== undefined) body.sku = datos.sku;
      if (datos.variaciones !== undefined) body.variaciones = datos.variaciones;
      if (datos.activo !== undefined) body.activo = datos.activo;

      const response = await api.put(`/api/productos/${id}`, body);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  },

  async eliminarProducto(id) {
    try {
      if (!id) throw new Error('ID de producto no válido');

      await api.delete(`/api/productos/${id}`);
      return true;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  },

  async buscarProductos(termino) {
    try {
      if (!termino || termino.trim() === '') {
        return await this.obtenerProductos();
      }

      const response = await api.get(`/api/productos?search=${encodeURIComponent(termino.trim())}`);
      return response.data || [];
    } catch (error) {
      console.error('Error al buscar productos:', error);
      throw error;
    }
  },

  async obtenerProductosPorCategoria(categoriaId) {
    try {
      const response = await api.get(`/api/productos?categoriaId=${categoriaId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error al filtrar productos por categoría:', error);
      throw error;
    }
  },

  // ==================== VARIACIONES ====================

  calcularPrecioConVariacion(producto, variacionId) {
    if (!variacionId || !producto.variaciones) {
      return producto.precio || producto.precioBase;
    }

    const variacion = producto.variaciones.find(v => v.id === variacionId);

    if (!variacion) {
      return producto.precio || producto.precioBase;
    }

    return (producto.precio || producto.precioBase) + (variacion.precioAdicional || 0);
  }
};

export default productosService;
