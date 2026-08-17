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
    
    // Seed sellers (pre-registered) → isApproved: true so they show in demo
    if(d.sellerStatus==='pre-registered' || d.isSeedData===true){
      if(d.isApproved!==true) updates.isApproved=true;
    }
    // Active real sellers → keep approved
    else if(d.sellerStatus==='active'){
      if(d.isApproved!==true) updates.isApproved=true;
    }
    // Everyone else (Brother Bernard, etc.) → PENDING unless already active
    else {
      if(!d.sellerStatus) updates.sellerStatus='pending';
      if(d.isApproved!==false) updates.isApproved=false;
      if(!d.statusBadge) updates.statusBadge='Pending Approval';
    }
    
    if(Object.keys(updates).length>0){
      await doc.ref.update(updates);
      console.log(`🔧 ${doc.id}: ${JSON.stringify(updates)}`);
      fixed++;
    }
  }
  console.log(`\n✅ Fixed ${fixed} of ${snap.size} sellers`);
}
fix().catch(e=>{console.error('❌',e.message);process.exit(1);});
