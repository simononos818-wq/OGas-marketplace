import Link from 'next/link';

export default function LaunchBanner() {
  return (
    <Link href="/launch" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',background:'linear-gradient(90deg,#0a8f84,#0fb5a6)',color:'#fff',padding:'12px 16px',fontWeight:800,fontSize:'15px',textDecoration:'none',textAlign:'center',flexWrap:'wrap'}}>
      🔥 90-Day Free Program is live — ₦0 commission, ₦300 referral bonuses
      <span style={{background:'rgba(255,255,255,.2)',borderRadius:'999px',padding:'3px 14px',fontSize:'13px',flexShrink:0}}>Learn more →</span>
    </Link>
  );
}
