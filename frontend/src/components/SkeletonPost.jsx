import React from 'react';
const SkeletonPost = () => (
  <div className="ap-card" style={{ padding:16 }}>
    <div style={{ display:'flex', gap:10, marginBottom:12 }}>
      <div className="ap-shimmer" style={{ width:44, height:44, borderRadius:'50%', flexShrink:0 }} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
        <div className="ap-shimmer" style={{ height:12, width:130, borderRadius:6 }} />
        <div className="ap-shimmer" style={{ height:10, width:95, borderRadius:6 }} />
      </div>
    </div>
    <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:12 }}>
      <div className="ap-shimmer" style={{ height:12, width:'100%', borderRadius:6 }} />
      <div className="ap-shimmer" style={{ height:12, width:'85%', borderRadius:6 }} />
      <div className="ap-shimmer" style={{ height:12, width:'70%', borderRadius:6 }} />
    </div>
    <div className="ap-shimmer" style={{ height:160, width:'100%', borderRadius:12, marginBottom:12 }} />
    <div style={{ display:'flex', gap:6 }}>
      {[78,84,68,64].map((w,i)=><div key={i} className="ap-shimmer" style={{ height:30, width:w, borderRadius:9999 }} />)}
    </div>
  </div>
);
export default SkeletonPost;
