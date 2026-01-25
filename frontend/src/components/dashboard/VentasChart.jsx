import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
//import { useMemo } from 'react';

// Componente CustomTooltip fuera del render
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900">
          {payload[0].payload.dia || payload[0].payload.nombre}
        </p>
        <p className="text-lg font-bold text-blue-600">
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

const VentasChart = ({ data, tipo = 'line' }) => {
  if (tipo === 'area') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="dia" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fill="url(#colorTotal)"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="dia" 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke="#3b82f6" 
          strokeWidth={3}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default VentasChart;