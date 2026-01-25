import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User } from 'lucide-react';

// Componente CustomTooltip fuera del render
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900">
          Empleado {payload[0].payload.empleadoId}
        </p>
        <p className="text-lg font-bold text-green-600">
          ${payload[0].value.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500">
          {payload[0].payload.cantidad} {payload[0].payload.cantidad === 1 ? 'venta' : 'ventas'}
        </p>
      </div>
    );
  }
  return null;
};

const VentasPorEmpleado = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No hay datos de empleados</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="empleadoId" 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
          label={{ value: 'Empleado ID', position: 'insideBottom', offset: -5 }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="total" 
          fill="#10b981" 
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default VentasPorEmpleado;