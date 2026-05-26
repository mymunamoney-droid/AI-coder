import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import AgentChain from '../components/AgentChain';
import LogsPanel from '../components/LogsPanel';
import FileExplorer from '../components/FileExplorer';
import { useSocket } from '../hooks/useSocket';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [logs, setLogs] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [files, setFiles] = useState({});
  const [selected, setSelected] = useState('');
  const [projectName, setProjectName] = useState('');
  const [timeline, setTimeline] = useState([]);

  useSocket({
    status: ({ agent, state }) => { setStatuses((s) => ({ ...s, [agent]: state })); setTimeline((t) => [...t, `${agent}: ${state}`]); },
    log: ({ message }) => setLogs((l) => [...l, message]),
    stream: ({ agent, chunk }) => setLogs((l) => [...l, `[${agent}] ${chunk.slice(0, 180)}...`]),
    complete: ({ files, projectName }) => { setFiles(files); setSelected(Object.keys(files)[0] || ''); setProjectName(projectName); setLogs((l) => [...l, 'Project generated successfully']); },
    error: ({ message }) => setLogs((l) => [...l, `ERROR: ${message}`])
  });

  const run = async () => {
    setLogs([]); setFiles({}); setTimeline([]);
    await fetch('http://localhost:4000/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
  };

  return <main className='min-h-screen p-4 md:p-8'>
    <div className='max-w-7xl mx-auto grid md:grid-cols-4 gap-4'>
      <aside className='glass p-4 md:col-span-1'>
        <h1 className='text-2xl font-bold mb-4'>AI Dev Squad</h1>
        <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder='Describe what to build...' className='w-full h-32 bg-slate-900 p-3 rounded' />
        <button onClick={run} className='mt-3 w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold p-2 rounded'>Run Agent Squad</button>
        {projectName && <a href={`http://localhost:4000/api/download/${projectName}`} className='block text-center mt-3 p-2 bg-emerald-500 text-black rounded'>Download Project</a>}
      </aside>
      <section className='md:col-span-3 space-y-4'>
        <AgentChain statuses={statuses} />
        <div className='grid md:grid-cols-2 gap-4'>
          <LogsPanel logs={logs} />
          <div className='glass p-4 h-64 overflow-auto text-sm'>{timeline.map((e,i)=><div key={i}>{e}</div>)}</div>
        </div>
        <div className='grid md:grid-cols-3 gap-4'>
          <FileExplorer files={files} selected={selected} onSelect={setSelected} />
          <div className='md:col-span-2 glass p-2 h-72 overflow-auto'>
            <SyntaxHighlighter language='javascript' style={oneDark}>{files[selected] || '// Generated file will appear here'}</SyntaxHighlighter>
          </div>
        </div>
      </section>
    </div>
  </main>;
}
