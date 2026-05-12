import { useState } from "react"

interface Props {
  condition: string | null
  onSave: (condition: string | null) => void
  onDelete: () => void
}

export default function EdgeMenu({ condition, onSave, onDelete }: Props) {
  const [value, setValue] = useState(condition ?? "")

  return (
    <div className="p-3 bg-white dark:bg-slate-900 border rounded-lg shadow-lg min-w-[200px]">
      <label className="block text-xs font-medium mb-1">Condition (Python expr)</label>
      <input
        className="w-full border rounded px-2 py-1 text-xs mb-2"
        placeholder='e.g. "billing" in msg'
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
          onClick={() => onSave(value || null)}
        >
          Save
        </button>
        <button className="text-xs px-2 py-1 border rounded" onClick={() => onSave(null)}>
          Clear
        </button>
        <button className="text-xs px-2 py-1 border rounded text-red-600" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}
