export default function FileExplorer({ files, selected, onSelect }) {
  return <div className='glass p-3 h-72 overflow-auto'>{Object.keys(files).map((f)=><button key={f} onClick={()=>onSelect(f)} className={`block w-full text-left p-2 rounded ${selected===f?'bg-cyan-500/20':''}`}>{f}</button>)}</div>;
}
