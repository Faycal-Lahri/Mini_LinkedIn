import React from 'react';
import useConfirmStore from '../store/confirmStore';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = () => {
  const { isOpen, message, onConfirm, onCancel } = useConfirmStore();
  if (!isOpen) return null;
  return (
    <div className="anim-fadein" onClick={e => e.target === e.currentTarget && onCancel()} style={{ position:'fixed', inset:0, zIndex:10000, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 0 12px', background:'rgba(0,0,0,.28)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }}>
      <style>{`@media(min-width:640px){.conf-card{margin:auto!important;border-radius:22px!important}}`}</style>
      <div className="conf-card anim-spring" style={{ width:'100%', maxWidth:370, background:'rgba(255,255,255,.94)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderRadius:'22px 22px 0 0', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.15)' }}>
        <div style={{ width:34, height:4, background:'#c7c7cc', borderRadius:2, margin:'10px auto 0' }} />
        <div style={{ padding:'22px 22px 18px', textAlign:'center' }}>
          <div style={{ width:48, height:48, borderRadius:12, background:'#ffeeed', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <AlertTriangle style={{ width:22, height:22, color:'#ff3b30' }} />
          </div>
          <h3 style={{ fontSize:16, fontWeight:700, color:'#1d1d1f', marginBottom:6, letterSpacing:'-.01em' }}>Confirmation</h3>
          <p style={{ fontSize:13, color:'#6e6e73', lineHeight:1.5 }}>{message}</p>
        </div>
        <div style={{ borderTop:'.5px solid rgba(0,0,0,.08)' }}>
          <button onClick={onConfirm} style={{ display:'block', width:'100%', padding:'14px', background:'transparent', border:'none', fontSize:15, fontWeight:600, color:'#ff3b30', cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.background='#ffeeed'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>Confirmer</button>
          <div style={{ height:'.5px', background:'rgba(0,0,0,.08)' }} />
          <button onClick={onCancel} style={{ display:'block', width:'100%', padding:'14px', background:'transparent', border:'none', fontSize:15, fontWeight:500, color:'#1d1d1f', cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.background='#f5f5f7'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>Annuler</button>
        </div>
      </div>
    </div>
  );
};
export default ConfirmModal;
