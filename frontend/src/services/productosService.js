// Servicio para manejar productos y categorías
// Por ahora usa localStorage, luego lo conectaremos a Google Sheets

class ProductosService {
  constructor() {
    this.categoriasKey = 'categorias';
    this.productosKey = 'productos';
    this.initializeData();
  }

  initializeData() {
    // Inicializar con datos de ejemplo si no existen
    if (!localStorage.getItem(this.categoriasKey)) {
      const categoriasIniciales = [
        { id: 1, nombre: 'Bebidas', descripcion: 'Bebidas frías y calientes', activo: true },
        { id: 2, nombre: 'Snacks', descripcion: 'Snacks y mecatos', activo: true },
        { id: 3, nombre: 'Dulces', descripcion: 'Dulces y chocolates', activo: true },
        { id: 4, nombre: 'Licores', descripcion: 'Bebidas alcohólicas', activo: true },
      ];
      localStorage.setItem(this.categoriasKey, JSON.stringify(categoriasIniciales));
    }

    if (!localStorage.getItem(this.productosKey)) {
      const productosIniciales = [
        {
          id: 1,
          nombre: 'Coca-Cola',
          categoriaId: 1,
          precioBase: 2500,
          activo: true,
          variaciones: [
            { id: 1, tipo: 'Tamaño', valor: '350ml', precioAdicional: 0 },
            { id: 2, tipo: 'Tamaño', valor: '1.5L', precioAdicional: 1500 },
            { id: 3, tipo: 'Tamaño', valor: '3L', precioAdicional: 3000 },
          ]
        },
        {
          id: 2,
          nombre: 'Doritos',
          categoriaId: 2,
          precioBase: 3000,
          activo: true,
          variaciones: [
            { id: 4, tipo: 'Presentación', valor: 'Individual', precioAdicional: 0 },
            { id: 5, tipo: 'Presentación', valor: 'Mega', precioAdicional: 1000 },
          ]
        },
      ];
      localStorage.setItem(this.productosKey, JSON.stringify(productosIniciales));
    }
  }

  // ========== CATEGORÍAS ==========

  getCategorias() {
    const data = localStorage.getItem(this.categoriasKey);
    return data ? JSON.parse(data) : [];
  }

  getCategoria(id) {
    const categorias = this.getCategorias();
    return categorias.find(c => c.id === id);
  }

  crearCategoria(categoria) {
    const categorias = this.getCategorias();
    const newId = Math.max(0, ...categorias.map(c => c.id)) + 1;
    const nuevaCategoria = {
      id: newId,
      ...categoria,
      activo: true
    };
    categorias.push(nuevaCategoria);
    localStorage.setItem(this.categoriasKey, JSON.stringify(categorias));
    return nuevaCategoria;
  }

  actualizarCategoria(id, datos) {
    const categorias = this.getCategorias();
    const index = categorias.findIndex(c => c.id === id);
    if (index !== -1) {
      categorias[index] = { ...categorias[index], ...datos };
      localStorage.setItem(this.categoriasKey, JSON.stringify(categorias));
      return categorias[index];
    }
    return null;
  }

  eliminarCategoria(id) {
    const categorias = this.getCategorias();
    const productos = this.getProductos();
    
    // Verificar si hay productos en esta categoría
    const tieneProductos = productos.some(p => p.categoriaId === id);
    if (tieneProductos) {
      throw new Error('No se puede eliminar una categoría con productos asociados');
    }

    const filtered = categorias.filter(c => c.id !== id);
    localStorage.setItem(this.categoriasKey, JSON.stringify(filtered));
    return true;
  }

  // ========== PRODUCTOS ==========

  getProductos() {
    const data = localStorage.getItem(this.productosKey);
    return data ? JSON.parse(data) : [];
  }

  getProducto(id) {
    const productos = this.getProductos();
    return productos.find(p => p.id === id);
  }

  getProductosPorCategoria(categoriaId) {
    const productos = this.getProductos();
    return productos.filter(p => p.categoriaId === categoriaId);
  }

  crearProducto(producto) {
    const productos = this.getProductos();
    const newId = Math.max(0, ...productos.map(p => p.id)) + 1;
    const nuevoProducto = {
      id: newId,
      ...producto,
      variaciones: producto.variaciones || [],
      activo: true
    };
    productos.push(nuevoProducto);
    localStorage.setItem(this.productosKey, JSON.stringify(productos));
    return nuevoProducto;
  }

  actualizarProducto(id, datos) {
    const productos = this.getProductos();
    const index = productos.findIndex(p => p.id === id);
    if (index !== -1) {
      productos[index] = { ...productos[index], ...datos };
      localStorage.setItem(this.productosKey, JSON.stringify(productos));
      return productos[index];
    }
    return null;
  }

  eliminarProducto(id) {
    const productos = this.getProductos();
    const filtered = productos.filter(p => p.id !== id);
    localStorage.setItem(this.productosKey, JSON.stringify(filtered));
    return true;
  }

  buscarProductos(termino) {
    const productos = this.getProductos();
    const terminoLower = termino.toLowerCase();
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(terminoLower)
    );
  }
}

// Exportar instancia única
const productosService = new ProductosService();
export default productosService;