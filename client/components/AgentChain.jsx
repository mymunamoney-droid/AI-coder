import { motion } from 'framer-motion';

export default function AgentChain({ statuses }) {
  const agents = ['Gemini', 'Qwen', 'Nemotron', 'Owl'];
  return <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>{agents.map((a) => <motion.div key={a} className='glass p-3' animate={{ scale: statuses[a]==='running'?1.05:1 }}><p>{a}</p><p className='text-xs text-cyan-300'>{statuses[a]||'idle'}</p></motion.div>)}</div>;
}
