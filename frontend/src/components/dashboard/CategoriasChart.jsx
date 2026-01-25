import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useMemo } from 'react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Componente CustomTooltip fuera del render
const CustomTooltip = ({ active, payload, data }) => {
  if (active && payload && payload.length) {
    const porcentaje = ((payload[0].value / data.reduce((sum, item) => sum + item.total, 0)) * 100).toFixed(1);
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
        <p className="text-lg font-bold text-blue-600">
          ${payload[0].value.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500">{porcentaje}% del total</p>
      </div>
    );
  }
  return null;
};

const CategoriasChart = ({ data }) => {
  const totalVentas = useMemo(() => 
    data.reduce((sum, item) => sum + item.total, 0), 
    [data]
  );

  const renderLabel = (entry) => {
    const porcentaje = ((entry.total / totalVentas) * 100).toFixed(0);
    return `${porcentaje}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="total"
          nameKey="nombre"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={(props) => <CustomTooltip {...props} data={data} />} />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => (
            <span className="text-sm text-gray-700">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CategoriasChart;