import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function MonthlyChart({ data }) {
  const formatted = data.map((d) => ({
    ...d,
    month: new Date(parseInt(d.month.split('-')[0]), parseInt(d.month.split('-')[1]) - 1).toLocaleDateString('en-US', { month: 'short' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} barGap={4}>
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} width={50} />
        <Tooltip
          formatter={(value) => `$${value.toLocaleString()}`}
          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" name="Income" fill="#34C759" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#FF3B30" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
