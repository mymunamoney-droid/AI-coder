export default function LogsPanel({ logs }) {
  return <div className='glass p-4 h-64 overflow-auto text-sm'>{logs.map((l,i)=><div key={i}>• {l}</div>)}</div>;
}
