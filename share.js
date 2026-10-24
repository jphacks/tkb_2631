// 名前だけの公開デモ。名前は本人確認にはならないため、個人情報は保存しない。
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,signInAnonymously} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getFirestore,collection,doc,onSnapshot,runTransaction,setDoc,addDoc} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig={
 apiKey:'AIzaSyALoor_ajyAWgnXvNzC4tV6yys8zDVu7aU',
 authDomain:'tanboru-2da31.firebaseapp.com',
 projectId:'tanboru-2da31',
 storageBucket:'tanboru-2da31.firebasestorage.app',
 messagingSenderId:'569005259530',
 appId:'1:569005259530:web:1664fee5a45b7ef45e18f3'
};
const app=initializeApp(firebaseConfig),db=getFirestore(app),auth=getAuth(app);
const users=collection(db,'users'),userStates=collection(db,'user_states'),rooms=collection(db,'rooms');
const clientId=crypto.randomUUID();
const safeName=name=>String(name||'').normalize('NFKC').trim().replace(/\s+/g,' ');
async function nameId(name){const normalized=safeName(name);if(!normalized||normalized.length>30||/[\x00-\x1f\x7f]/.test(normalized))throw new Error('名前は1〜30文字で入力してください');const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalized.toLocaleLowerCase('ja-JP')));return 'u_'+Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')}
const profileOf=(id,data)=>({id,name:String(data?.name||'なかま').slice(0,30),avatar:Number.isInteger(data?.avatar)?data.avatar:0,department:String(data?.department||'').slice(0,60),year:String(data?.year||'').slice(0,20),university:String(data?.university||'').slice(0,60)});
let unsubRooms,unsubUsers,unsubState,unsubReactions;
let stateWrite=Promise.resolve();
const share={me:null,rooms:[],users:[],error:null,
 async login(name,initialState){
  await signInAnonymously(auth);
  const id=await nameId(name),userRef=doc(users,id),stateRef=doc(userStates,id),cleanName=safeName(name);
  const result=await runTransaction(db,async tx=>{
   const user=await tx.get(userRef),saved=await tx.get(stateRef);
   if(!user.exists())tx.set(userRef,{name:cleanName,avatar:initialState.profile.avatar,department:initialState.profile.department||'',year:initialState.profile.year||'1年生',university:initialState.profile.university||'',createdAt:Date.now()});
   if(!saved.exists())tx.set(stateRef,{data:initialState,updatedAt:Date.now(),source:clientId});
   return {id,state:saved.exists()?saved.data().data:initialState,profile:user.exists()?profileOf(id,user.data()):profileOf(id,{...initialState.profile,name:cleanName})};
  });
  this.logout();this.me=id;this.error=null;
  unsubUsers=onSnapshot(users,snap=>{this.users=snap.docs.map(d=>profileOf(d.id,d.data()));window.onSharedData?.()},e=>{this.error=e;window.onShareError?.(e)});
  unsubRooms=onSnapshot(rooms,snap=>{this.rooms=snap.docs.map(d=>({id:d.id,...d.data()}));window.onSharedData?.()},e=>{this.error=e;window.onShareError?.(e)});
  unsubState=onSnapshot(stateRef,snap=>{if(!snap.exists()||snap.metadata.hasPendingWrites||snap.data().source===clientId)return;window.onCloudState?.(snap.data().data)},e=>{this.error=e;window.onShareError?.(e)});
  return result;
 },
 async saveState(data){if(!this.me)return;const profile=data.profile||{},id=this.me;stateWrite=stateWrite.catch(()=>{}).then(()=>Promise.all([
  setDoc(doc(userStates,id),{data,updatedAt:Date.now(),source:clientId}),
  setDoc(doc(users,id),{name:String(profile.name||'なかま').slice(0,30),avatar:profile.avatar||0,department:profile.department||'',year:profile.year||'',university:profile.university||''},{merge:true})
 ]));return stateWrite},
 async createRoom(room){if(!this.me)throw new Error('名前を登録してください');const ref=doc(rooms);const data={...room,hostId:this.me,members:{},createdAt:Date.now(),closedAt:null};await setDoc(ref,data);return {id:ref.id,...data}},
 async join(roomId,member){if(!this.me)throw new Error('名前を登録してください');const ref=doc(rooms,roomId),me=this.me;return runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())throw new Error('作業場が見つかりません');const room=snap.data(),members={...(room.members||{})},active=Object.values(members).filter(m=>!m.leftAt).length;if(room.closedAt||room.endAt-Date.now()<180000)throw new Error('この作業場はもうすぐ終了します');if(members[me])throw new Error('この作業場には参加済みです');if(room.hostId===me||active+1>=room.capacity)throw new Error('この作業場は満員です');members[me]={...member,joinedAt:Date.now(),leftAt:null,arrivedAt:member.arrivedAt||null};tx.update(ref,{members});return {id:roomId,...room,members}})},
 async arrive(roomId){if(!this.me)return;const ref=doc(rooms,roomId),me=this.me;await runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())return;const members={...(snap.data().members||{})};if(!members[me])return;members[me]={...members[me],arrivedAt:Date.now()};tx.update(ref,{members})})},
 async leave(room){if(!room?.id||!this.me)return;const ref=doc(rooms,room.id),me=this.me;await runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())return;const data=snap.data();if(data.hostId===me){tx.update(ref,{closedAt:Date.now()});return}const members={...(data.members||{})};if(members[me]&&!members[me].leftAt){members[me]={...members[me],leftAt:Date.now()};tx.update(ref,{members})}})},
 watchReactions(roomId,callback){unsubReactions?.();let initial=true;unsubReactions=onSnapshot(collection(db,'rooms',roomId,'reactions'),snap=>{if(initial){initial=false;return}for(const change of snap.docChanges())if(change.type==='added'&&change.doc.data().fromId!==this.me)callback(change.doc.data())},e=>{this.error=e;window.onShareError?.(e)})},
 stopReactions(){unsubReactions?.();unsubReactions=null},
 async react(roomId,kind,toId=null){if(!this.me)throw new Error('名前を登録してください');await addDoc(collection(db,'rooms',roomId,'reactions'),{fromId:this.me,toId,kind,at:Date.now()})},
 logout(){unsubRooms?.();unsubUsers?.();unsubState?.();unsubReactions?.();unsubRooms=unsubUsers=unsubState=unsubReactions=null;this.me=null;this.rooms=[];this.users=[]}
};
window.share=share;
