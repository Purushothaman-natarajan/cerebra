import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TokenData {
  time: string
  tokens: number
  cost: number
}

interface Props {
  data: TokenData[]
}

export default function TokenChart({ data }: Props) {
  if (data.length === 0) return <p className="text-sm text-gray-400">No token data yet</p>

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="tokens" stroke="#3b82f6" strokeWidth={2} />
          <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
