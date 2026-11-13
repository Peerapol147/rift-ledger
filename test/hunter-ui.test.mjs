import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/core/index.js';
import * as H from '../src/ui/layout.js';
const life = () => { const s=C.newLife('hunter-ui'); s.ageM=360; s.focus='work'; s.focus2='study'; return s; };

test('the interface distinguishes waiting, paused, running and an active operation', () => {
  assert.equal(typeof H.interfaceStatus, 'function');
  const s=life();
  assert.equal(H.interfaceStatus(s,{paused:false,settings:false,policy:'stop'}).text,'กำลังใช้ชีวิต');
  C.openEvent(s,{id:'review',t:'เลือก',o:[{l:'ตอบ',y:{}}]});
  assert.equal(H.interfaceStatus(s,{paused:false,policy:'stop'}).text,'รอคุณเลือก');
  assert.equal(H.interfaceStatus(s,{paused:true,policy:'stop'}).text,'หยุดแล้ว');
  s.ev=null;s.op={def:{t:'เกต'}};
  assert.equal(H.interfaceStatus(s,{paused:false,policy:'stop'}).text,'กำลังปฏิบัติการ');
});
test('the plan strip shows actual plans and exposes their existing actions', () => {
  assert.equal(typeof H.planPanel, 'function');
  const s=life(),html=H.planPanel(s);
  assert.match(html,/ทำงาน/);assert.match(html,/เรียนเพิ่ม/);assert.match(html,/เปลี่ยนแผน/);
  assert.match(html,/data-a="focus:train"/);assert.match(html,/data-a="focus2:study"/);
  assert.ok(!H.card(s).includes('data-a="focus:'),'the character summary does not bury plan controls');
});
test('hunter chrome escapes live names and includes the real world date', () => {
  assert.equal(typeof H.hunterHeader,'function');
  const s=life();s.name='<img src=x onerror=alert(1)>';
  const html=H.hunterHeader(s,{paused:false,policy:'stop'});
  assert.ok(html.includes('RIFT LEDGER'));assert.ok(html.includes('2081'));
  assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img'));
});
test('mobile navigation has a More disclosure containing every additional visible tab', () => {
  const s=life(),html=H.tabsBar(s,'world',true);
  assert.match(html,/เพิ่มเติม/);assert.match(html,/data-a="tab:book"/);
  assert.match(html,/data-a="tab:world"/);assert.match(html,/aria-current="page"/);
  const kid=H.tabsBar(C.newLife('kid-ui'),'log',true);
  assert.ok(!kid.includes('data-a="tab:items"'));assert.ok(!kid.includes('data-a="tab:team"'));
});
test('an active discovered story has its own title without disclosing routes', () => {
  const s=life();s.job={id:'office',tier:0,xp:0};C.startStory(s,'office');
  s.narrative.stories.office.due=0;C.narrativeMonth(s);
  const html=H.eventPanel(s,false,null);
  assert.match(html,/แฟ้มที่ไม่ได้ปิด/);
  for(const secret of ['complicity','client-return','ending']) assert.ok(!html.includes(secret));
});
