import React, { useEffect, useState } from 'react';

export const TopBarLoader = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let iv;
    if (isLoading) {
      setVisible(true); setProgress(20);
      iv = setInterval(() => setProgress(p => p >= 80 ? p : p + (80 - p) * 0.15), 80);
    } else {
      setProgress(100);
      const t = setTimeout(() => { setVisible(false); setProgress(0); }, 200);
      return () => clearTimeout(t);
    }
    return () => clearInterval(iv);
  }, [isLoading]);

  if (!visible) return null;
  return (
    <div className="ap-topbar">
      <div className="ap-topbar-fill" style={{ width: `${progress}%` }} />
    </div>
  );
};

export const BrandLoader = () => (
  <div className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center gap-5">
    <div className="anim-spring">
      <div className="flex items-center gap-2">
        <div style={{ width:36, height:36, borderRadius:9, background:'#0071e3', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 3l8 4.5-8 4.5-8-4.5L10 3z" fill="white" fillOpacity=".9"/>
            <path d="M4 10.5V16l6 3.5 6-3.5v-5.5" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontSize:22, fontWeight:700, letterSpacing:'-.025em', color:'#1d1d1f' }}>
          Schol<span style={{ color:'#0071e3' }}>ar</span>
        </span>
      </div>
    </div>
    <div style={{ width:22, height:22, border:'2px solid #e8e8ed', borderTopColor:'#0071e3', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
  </div>
);
