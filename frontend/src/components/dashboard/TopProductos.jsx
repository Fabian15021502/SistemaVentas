import { TrendingUp, Package } from 'lucide-react';

const TopProductos = ({ productos }) => {
  const maxVenta = productos.length > 0 ? Math.max(...productos.map(p => p.total || 0)) : 1;

  return (
    <div className="space-y-4">
      {productos.length > 0 ? (
        productos.map((producto, index) => {
          const key = producto.id || producto.productoId || index;
          const porcentaje = ((producto.total || 0) / (maxVenta || 1)) * 100;
          
          return (
            <div key={key} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{producto.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {producto.cantidad || producto.cantidadVendida || 0} unidades vendidas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    ${(producto.total || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No hay datos de productos</p>
        </div>
      )}
    </div>
  );
};

export default TopProductos;