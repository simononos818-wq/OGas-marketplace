const fs=require('fs');
if(!fs.existsSync('./serviceAccountKey.json')){console.error('❌ Missing key');process.exit(1);}
let db,FV;
try{const{initializeApp,cert}=require('firebase-admin/app');const{getFirestore,FieldValue}=require('firebase-admin/firestore');initializeApp({credential:cert(require('./serviceAccountKey.json'))});db=getFirestore();FV=FieldValue;console.log('✅ Firebase connected');}catch(e){const admin=require('firebase-admin');admin.initializeApp({credential:admin.credential.cert(require('./serviceAccountKey.json'))});db=admin.firestore();FV=admin.firestore.FieldValue;}

async function fix(){
  const snap=await db.collection('sellers').get();
  let fixed=0;
  for(const doc of snap.docs){
    const d=doc.data();
    let updates={};
    
    // Copy isVerified → verified if missing
    if(d.isVerified===true && d.verified!==true) updates.verified=true;
    if(d.isVerified===false && d.verified!==false) updates.verified=false;
    
    // If no verified field at all, set based on isVerified or default to true for seeds
    if(d.verified===undefined && d.isVerified===undefined) {
      if(d.isSeedData) updates.verified=true;
      else updates.verified=false;
    }
    
    // Approve Simon's real seller (seller_simon_001)
    if(doc.id==='seller_simon_001' || d.businessName?.toLowerCase().includes('simon') || d.businessName?.toLowerCase().includes('mega think')) {
      if(d.isApproved!==true) updates.isApproved=true;
      if(d.sellerStatus!=='active') updates.sellerStatus='active';
      if(d.statusBadge!=='Verified Seller') updates.statusBadge='Verified Seller';
      if(d.verified!==true) updates.verified=true;
      console.log(`👤 Found Simon's seller: ${doc.id} - ${d.businessName}`);
    }
    
    // Approve Brother Bernard if you want him live (he's currently pending)
    // Remove this block if you want him to stay pending
    if(doc.id==='6qTtbiGObTOobH0pNc1V7LV8JT42') {
      console.log(`👤 Brother Bernard: ${d.businessName} - currently pending, skipping`);
    }
    
    if(Object.keys(updates).length>0){
      await doc.ref.update(updates);
      console.log(`🔧 ${doc.id}: ${JSON.stringify(updates)}`);
      fixed++;
    } else {
      console.log(`✅ ${doc.id}: ${d.businessName} - OK`);
    }
  }
  console.log(`\n✅ Fixed ${fixed} of ${snap.size} sellers`);
}
fix().catch(e=>{console.error('❌',e.message);process.exit(1);});
