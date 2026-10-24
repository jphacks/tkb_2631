// 作業場の共有：自分がひらいた作業場を Firebase（Firestore）に置き、ほかの人の画面にもリアルタイムで出す
// app.js からは window.share（rooms・me・publish・join・leave）を使い、変化があると window.onSharedRooms() を呼ぶ
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getFirestore,collection,doc,onSnapshot,setDoc,updateDoc,deleteDoc,deleteField} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig={
 apiKey:'AIzaSyALoor_ajyAWgnXvNzC4tV6yys8zDVu7aU',
 authDomain:'tanboru-2da31.firebaseapp.com',
 projectId:'tanboru-2da31',
 storageBucket:'tanboru-2da31.firebasestorage.app',
 messagingSenderId:'569005259530',
 appId:'1:569005259530:web:1664fee5a45b7ef45e18f3'
};
const db=getFirestore(initializeApp(firebaseConfig));
const rooms=collection(db,'rooms');

// この端末を見分けるID（ログインの代わり）
let me;try{me=localStorage.getItem('tanboru-client')}catch{}
if(!me){me=Math.random().toString(36).slice(2,12);try{localStorage.setItem('tanboru-client',me)}catch{}}

const share={rooms:[],me,
 // 自分の作業場をひらく（1人1つ。ドキュメントIDは自分のID）
 async publish(room){try{await setDoc(doc(rooms,me),{...room,members:{},createdAt:Date.now()})}catch(e){console.error('作業場を共有できませんでした',e)}},
 // ほかの人の作業場に入る
 async join(id,member){try{await updateDoc(doc(rooms,id),{['members.'+me]:{...member,joinedAt:Date.now()}})}catch(e){console.error('作業場に参加できませんでした',e)}},
 // 作業場を出る・集中が終わる：自分の作業場なら消し、入っていた共有の作業場なら自分だけ抜ける
 async leave(room){try{if(room?.mine)await deleteDoc(doc(rooms,me));else if(room?.shared)await updateDoc(doc(rooms,room.shared),{['members.'+me]:deleteField()})}catch(e){console.error('作業場の片づけに失敗しました',e)}}
};
window.share=share;
onSnapshot(rooms,snap=>{share.rooms=snap.docs.map(d=>({id:d.id,...d.data()}));window.onSharedRooms?.()},e=>console.error('作業場の一覧を受け取れませんでした',e));
