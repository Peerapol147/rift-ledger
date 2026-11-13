# Hunter interface — implemented visual redesign

เจ้าของเลือกภาพแนวทาง Hunter โทนมืด น้ำเงิน–ม่วง และสั่งนำมาใส่เกมจริงเมื่อ14พฤศจิกายน2026

## สิ่งที่เปลี่ยน

- หน้าต่างระบบ Hunter พร้อมแบรนด์ วันที่โลก และสถานะ“รอคุณเลือก / หยุดแล้ว / กำลังใช้ชีวิต / กำลังปฏิบัติการ”จากstateจริง
- Desktopแยกตัวละคร ฉากสด และการ์ดเรื่อง พร้อมแถบแผนชีวิตใกล้เหตุการณ์
- Mobileมีข้อมูลย่อ ฉากสั้น ตัวเลือก และปุ่มเปลี่ยนแผนที่ไม่ต้องผ่านการ์ดค่าสถานะยาว
- เมนู5ตำแหน่งบนมือถือ พร้อมMoreสำหรับทุกแท็บเพิ่มเติมที่วัยนั้นเปิดได้; desktopยังแสดงครบทุกแท็บ
- คำเตือนและเป้าหมายที่ปักยังอ่าน/ยกเลิกได้บนมือถือใกล้แผนชีวิต
- คีย์บอร์ดเปิดsummaryด้วยSpaceได้โดยไม่ไปหยุดเวลา และยังรักษาfocus/dialog/touch cancellation
- สี กรอบ typography รายการของ หน้าตั้งค่า และหน้าเริ่มใช้ภาษาเดียวกัน
- ภาพเมืองoriginalสร้างด้วยimage_gen;ฝังในplay.html,ฉากเมืองยังมีspriteและeffectsจริง สถานที่อื่นและวัยทารกยังใช้ฉากเดิม

ไม่เปลี่ยนcore mechanics,ตัวเลขสมดุล,เนื้อเรื่อง,save schemaหรือระบบเพลง. ภาพแนวคิดไม่ได้ถูกนำมาใช้เป็นภาพหน้าจอแบน;ชื่อ ตัวเลือก ผล และค่าสถานะทุกอย่างเป็นข้อมูลเกมจริง

## ภาพจากเกมที่รันจริง

[Desktop](desktop.png) · [Mobile](mobile.png) · [Title](title.png)

ภาพใช้เซฟสังเคราะห์เพื่อแสดงlayoutเดียวกันอย่างเปรียบเทียบได้ ไม่ใช่ข้อมูลผู้เล่นจริง. เกมยังเล่นตั้งแต่เกิดและเปลี่ยนสถานะตามระบบเดิม

## ตรวจสอบ

- npm test:355passed/0failed
- node tools/artcheck.mjs:ผ่าน,0openrequests
- node tools/linelen.mjs:ผ่าน
- npm run build:ผ่าน พร้อมplay.htmlและdownloads/rift-ledger-play.zip
- tools/hunter-ui-check.mjs:14checksผ่าน รวม320–1440px,เด็ก/วัยรุ่น/ผู้ใหญ่/สูงวัย,ตัวอักษรใหญ่,More,แผน,Space,เป้าหมาย,คำเตือน,คำตอบจริงและdialog
- tools/ux-check.mjs:17checksผ่านหลังย้ายselectorแผนให้ตรงตำแหน่งใหม่
- เปิดoperationจริงและแท็บตัวฉันของฮันเตอร์โดยไม่พบpageerror

รันbrowserchecksในเครื่องที่มีChromium:

```bash
PORT=5183 node tools/serve.mjs
GAME_URL=http://127.0.0.1:5183 CHROMIUM_EXECUTABLE=/usr/bin/chromium node tools/hunter-ui-check.mjs
GAME_URL=http://127.0.0.1:5183 CHROMIUM_EXECUTABLE=/usr/bin/chromium node tools/ux-check.mjs
```

พอร์ตด้านบนใช้ตรวจภายในเครื่อง ไม่ใช่ลิงก์previewสาธารณะ. หากมีPlaywrightbrowserติดตั้งแล้ว ไม่ต้องระบุCHROMIUM_EXECUTABLE. BuildฝังCSSและภาพให้เกมเปิดofflineได้พร้อมaudioข้างไฟล์ตามZIPเดิม

## การรีวิวและข้อจำกัด

มีผู้ตรวจอิสระตรวจทั้งbranch พบSpaceบนsummaryและmobilehiddenalerts/goals ทั้งสองข้อเพิ่มbrowsertestที่เห็นREDก่อนแก้และผ่านGREENแล้ว;รันunit355ข้อผ่านหลังแก้

Moreจะปิดเมื่อสลับผ่านbreakpointdesktop/mobileและkeyboardfocusอาจกลับbody — เป็นminorที่เลื่อนไว้ เมนูทุกหมวดยังเข้าถึงได้ในแต่ละขนาดจอ

ตัวเลือกที่ตัดสินระหว่างทำ:ใช้ข้อมูลจริงแทนตัวเลขในmockup;คงsprite/animation;ใช้detailsเฉพาะMoreบนมือถือและtabsจริงบนdesktop;ใช้embeddedimgบนหน้าเริ่มแทนCSSvariabledataURLขนาดใหญ่;ย้ายปุ่มเพลงDOMเดิมแทนสร้างAudioใหม่. ต้นทุนคือภาพเพิ่มขนาดZIPประมาณ3.5MB และแบบถูกปรับตามข้อมูล/วัยจริงของเกม

ไม่ได้แก้ปัญหาexportเซฟเดิมนอกขอบเขตvisualtaskนี้ ไม่อ้างผลสมดุลจากsimulationใหม่เพราะไม่ได้เปลี่ยนcore. ยังไม่มีการmergeหรือdeployจากงานนี้
