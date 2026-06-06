import React from 'react';
import useToastStore from '../store/toastStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const CONF = {
  success: { bg:'#e4f8ec', ic:'#1a9a47', C: CheckCircle },
  error:   { bg:'#ffeeed', ic:'#d63029', C: AlertCircle },
  info:    { bg:'#e8f0fe', ic:'#0071e3', C: Info },
};

const Toast = () => {
  const { toasts, removeToast } = useToastStore();
  if (!toasts.length) return null;
  return (
    <div style={{ position:'fixed', top:16, right:16, zIndex:9999, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none', maxWidth:340, width:'calc(100vw - 32px)' }}>
      {toasts.map(t => {
        const c = CONF[t.type] || CONF.info;
        return (
          <div key={t.id} className="anim-in" style={{ pointerEvents:'auto', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(255,255,255,.9)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,.5)', borderRadius:14, boxShadow:'0 6px 24px rgba(0,0,0,.11)' }}>
            <div style={{ width:30, height:30, borderRadius:8, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <c.C style={{ width:15, height:15, color:c.ic }} />
            </div>
            <p style={{ flex:1, fontSize:13, fontWeight:600, color:'#1d1d1f', lineHeight:1.4 }}>{t.message}</p>
            <button onClick={() => removeToast(t.id)} style={{ width:18, height:18, borderRadius:'50%', background:'rgba(0,0,0,.06)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <X style={{ width:10, height:10, color:'#6e6e73' }} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
export default Toast;
