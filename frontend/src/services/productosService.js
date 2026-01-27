// src/services/productosService.js
import apiRequest from '../config/googleSheets';

const productosService = {
  // ==================== CATEGORÍAS ====================

  async obtenerCategorias() {
    try {
      console.log('📋 Obteniendo categorías...');
      const response = await apiRequest('getCategorias');
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

      const response = await apiRequest('crearCategoria', {
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
      if (!id) {
        throw new Error('ID de categoría no válido');
      }

      const response = await apiRequest('actualizarCategoria', {
        id,
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
      if (!id) {
        throw new Error('ID de categoría no válido');
      }

      await apiRequest('eliminarCategoria', { id });
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
      const response = await apiRequest('getProductos');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw new Error('No se pudieron cargar los productos.');
    }
  },

  async obtenerProductoPorId(id) {
    try {
      const productos = await this.obtenerProductos();
      const producto = productos.find(p => p.id === parseInt(id));

      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      return producto;
    } catch (error) {
      console.error('Error al obtener producto:', error);
      throw error;
    }
  },

  async crearProducto(producto) {
    try {
      if (!producto.nombre || producto.nombre.trim() === '') {
        throw new Error('El nombre del producto es obligatorio');
      }
      if (!producto.categoriaId) {
        throw new Error('Debe seleccionar una categoría');
      }
      if (!producto.precioBase || producto.precioBase <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      console.log('🛍️ Creando producto:', producto.nombre);

      const response = await apiRequest('crearProducto', {
        nombre: producto.nombre.trim(),
        categoriaId: parseInt(producto.categoriaId),
        precioBase: parseFloat(producto.precioBase),
        variaciones: JSON.stringify(producto.variaciones || [])
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
      if (!id) {
        throw new Error('ID de producto no válido');
      }

      const params = { id: parseInt(id) };

      if (datos.nombre) params.nombre = datos.nombre.trim();
      if (datos.categoriaId) params.categoriaId = parseInt(datos.categoriaId);
      if (datos.precioBase !== undefined) params.precioBase = parseFloat(datos.precioBase);
      if (datos.variaciones) params.variaciones = JSON.stringify(datos.variaciones);

      const response = await apiRequest('actualizarProducto', params);
      
      return response.data;
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  },

  async eliminarProducto(id) {
    try {
      if (!id) {
        throw new Error('ID de producto no válido');
      }

      await apiRequest('eliminarProducto', { id });
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

      const productos = await this.obtenerProductos();
      const terminoLower = termino.toLowerCase().trim();

      return productos.filter(p =>
        p.nombre.toLowerCase().includes(terminoLower) ||
        p.id.toString().includes(termino)
      );
    } catch (error) {
      console.error('Error al buscar productos:', error);
      throw error;
    }
  },

  async obtenerProductosPorCategoria(categoriaId) {
    try {
      const productos = await this.obtenerProductos();
      return productos.filter(p => p.categoriaId === parseInt(categoriaId));
    } catch (error) {
      console.error('Error al filtrar productos por categoría:', error);
      throw error;
    }
  },

  // ==================== VARIACIONES ====================

  calcularPrecioConVariacion(producto, variacionId) {
    if (!variacionId || !producto.variaciones) {
      return producto.precioBase;
    }

    const variacion = producto.variaciones.find(
      v => v.id === parseInt(variacionId)
    );
    
    if (!variacion) {
      return producto.precioBase;
    }

    return producto.precioBase + (variacion.precioAdicional || 0);
  }
};

export default productosService;