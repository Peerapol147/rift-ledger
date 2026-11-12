import {lifeStage} from './hero-art.js';
import {youngMotion} from './young-motion.js';
// Public identity only. Each tuple is a readable gesture, timing and small pixel amplitude.
const p=(label,kind,period,amount=1)=>Object.freeze({label,kind,period,amount});
export const CLASS_MOTION={
 knight:p('ตั้งดาบและเช็กแนวโล่','guard',4.8), shieldm:p('ถ่ายน้ำหนักค้ำโล่','brace',5.6),
 duel:p('ผ่อนข้อมือจับดาบ','blade',3.8), fmage:p('รวบเปลวไฟในฝ่ามือ','cast',4.3,2),
 bowst:p('เช็กแขนจับคันธนู','aim',4.9), priest:p('ยกมืออวยพร','bless',5.5),
 trap:p('ก้มสำรวจพื้น','inspect',4.6,2), sharp:p('ประคองแนวเล็ง','aim',6.1),
 bsmith:p('เคาะเครื่องมือเบา ๆ','tap',3.2,2), audit:p('ยกของขึ้นพิจารณา','inspect',5.7),
 seal:p('วาดวงผนึก','trace',4.7,2), mblade:p('คุมดาบพร้อมร่ายเวท','blade',4.2,2),
 necro:p('กวักมือเรียกเงา','beckon',6.3,2), saint:p('ผายมือส่งพร','bless',6.8,2),
 demon:p('ออกคำสั่งอย่างสงบ','command',7.2,2),
};
export const CAREER_MOTION={
 clerk:p('ขยับมือจดบันทึก','tap',4.6), trader:p('ผายมือเสนอสินค้า','beckon',4.3),
 doc:p('ก้มตรวจความพร้อม','inspect',5.1), porter:p('ปรับน้ำหนักสัมภาระ','brace',4.9,2),
 press:p('จดประเด็นข่าว','tap',3.9), cop:p('หันตรวจรอบตัว','guard',5.7),
 teach:p('ยกมืออธิบาย','trace',5.2), lawyer:p('ผายมือชี้แจง','command',5.8),
 adjuster:p('พิจารณาสิ่งของ','inspect',6.2), rescue:p('เช็กอุปกรณ์พร้อมช่วย','guard',4.4),
 cook:p('ขยับมือคนอาหาร','trace',3.7),
};
const AGES={
 infant:p('ดิ้นและโยกตัวเบา ๆ','infant',3), toddler:p('ก้าวสั้นและเด้งเล่น','toddler',2.4),
 child:p('หันสำรวจและขยับมือเล่น','curious',3.5,2), teen:p('โยกน้ำหนักอย่างกระฉับกระเฉง','curious',3.1),
 adult:p('หายใจและผ่อนหัวไหล่','rest',5), middle:p('ผ่อนบ่าอย่างช้า ๆ','rest',5.8),
 elder:p('ขยับตัวอย่างระมัดระวัง','lean',6.5), old:p('พักน้ำหนักและมองรอบตัว','lean',7.5),
};
export function motionProfile(ageM=0,classId=null,career=null){
 const life=lifeStage(Math.max(0,Number(ageM)||0)/12);
 if(ageM<36)return AGES[life];
 return CLASS_MOTION[classId]||CAREER_MOTION[career]||AGES[life];
}
const neutral=()=>({x:0,lift:0,body:0,head:0,left:0,right:0,crouch:0});
export function motionPose(profile,time,calm=false,busy=false){
 const out=neutral();if(calm||busy)return out;
 const {kind,period,amount:a}=profile, phase=time*2*Math.PI/period;
 const wave=Math.sin(phase), beat=Math.max(0,Math.sin(phase)), q=x=>Math.round(x);
 if(kind==='infant'||kind==='toddler')return {...out,...youngMotion(kind,time)};
 out.body=q(wave*.65);out.head=q(Math.sin(phase*.5)*.7);
 switch(kind){
 case 'guard':out.left=q(beat*a);out.right=-q(beat);break;
 case 'brace':out.body=q(beat*a);out.crouch=q(beat);out.left=-q(beat*a);break;
 case 'blade':out.right=q(wave*a);out.body=-q(wave);break;
 case 'aim':out.right=-q(beat*a);out.left=q(beat*a);out.head=q(beat);break;
 case 'cast':case 'bless':out.left=-q(beat*a);out.right=-q(beat*a);break;
 case 'inspect':out.head=q(beat*a);out.crouch=q(beat);out.right=-q(beat);break;
 case 'tap':out.right=q(Math.sin(phase*2)*a);break;
 case 'trace':out.right=q(wave*a);out.left=q(Math.cos(phase)*a);break;
 case 'beckon':out.left=q(Math.sin(phase*2)*a);out.head=-q(beat);break;
 case 'command':out.right=-q(beat*a);out.body=q(beat);break;
 case 'curious':out.head=q(wave*a);out.left=q(Math.sin(phase*2));break;
 case 'lean':out.body=q(beat);out.head=q(beat);break;
 }
 return out;
}
