"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#F4A460", "#6366F1", "#EC4899", "#10B981", "#F59E0B"];

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number; investment: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis stroke="#94A3B8" />
        <YAxis stroke="#94A3B8" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "8px",
          }}
          formatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#22C55E"
          strokeWidth={2}
          dot={{ fill: "#22C55E" }}
          name="Receita"
        />
        <Line
          type="monotone"
          dataKey="investment"
          stroke="#F4A460"
          strokeWidth={2}
          dot={{ fill: "#F4A460" }}
          name="Investimento"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface PerformanceChartProps {
  data: Array<{ channel: string; value: number }>;
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ channel, value }) => `${channel} ${value}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value}%`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface SalesChartProps {
  data: Array<{ date: string; sales: number; leads: number; conversions: number }>;
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis stroke="#94A3B8" />
        <YAxis stroke="#94A3B8" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Bar dataKey="leads" fill="#6366F1" name="Leads" radius={[8, 8, 0, 0]} />
        <Bar dataKey="sales" fill="#22C55E" name="Vendas" radius={[8, 8, 0, 0]} />
        <Bar dataKey="conversions" fill="#F4A460" name="Conversões" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
